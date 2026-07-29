import type { Period } from "@prisma/client";
import { db } from "@/lib/db";
import { getKpiRows, scopedKpiWhere } from "@/lib/analytics";
import type { SessionUser } from "@/lib/rbac";
import {
  RISK_LABEL,
  computeGapPct,
  isBelowEarlyWarningThreshold,
  riskFromGap,
  sortAlertsByRisk,
  type EarlyWarningRow,
} from "@/lib/early-warning-stats";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * قائمة حية لمؤشرات APPROVED تحت عتبة 85% للفترة الحالية.
 * مسار الكرون (cron-jobs) يبقى للإشعارات الخلفية فقط.
 */
export async function getLiveEarlyWarnings(opts: {
  user: SessionUser;
  year: number;
  period: Period;
}): Promise<EarlyWarningRow[]> {
  const [kpiRows, cards] = await Promise.all([
    getKpiRows({ user: opts.user, year: opts.year, period: opts.period }),
    db.deviationCard.findMany({
      where: {
        year: opts.year,
        period: opts.period,
        kpi: scopedKpiWhere(opts.user),
      },
      select: { id: true, kpiId: true },
    }),
  ]);

  const cardByKpi = new Map(cards.map((c) => [c.kpiId, c.id]));

  const live: EarlyWarningRow[] = [];

  for (const r of kpiRows) {
    if (!isBelowEarlyWarningThreshold(r.achievementPct, r.actual, r.target)) continue;

    const actual = r.actual as number;
    const target = r.target as number;
    const achievementPct =
      r.achievementPct ?? round1((actual / target) * 100);
    const gapPct = computeGapPct(achievementPct);
    const riskLevel = riskFromGap(gapPct);

    live.push({
      kpiId: r.kpiId,
      code: r.code,
      name: r.name,
      target,
      actual,
      achievementPct,
      gapPct,
      riskLevel,
      riskLabel: RISK_LABEL[riskLevel],
      deviationCardId: cardByKpi.get(r.kpiId) ?? null,
    });
  }

  return sortAlertsByRisk(live);
}
