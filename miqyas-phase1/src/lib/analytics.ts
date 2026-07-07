import type { KpiType, Period } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/rbac";
import { scopeFilter } from "@/lib/rbac";
import { achievementPct, deviationPct, kpiStatus } from "@/lib/kpi";
import type { KpiStatus } from "@/lib/types";

export type KpiAnalyticsRow = {
  kpiId: number;
  code: string;
  name: string;
  unit: string;
  baseline: number | null;
  annualTarget: number | null;
  target: number | null;
  actual: number | null;
  achievementPct: number | null;
  deviationPct: number | null;
  status: KpiStatus;
  departmentName: string | null;
  departmentId: number | null;
  sectionName: string | null;
  ownerLabel: string | null;
  strategicGoalCode: string | null;
  strategicGoalTitle: string | null;
  operationalGoalTitle: string | null;
  type: KpiType;
};

export async function getKpiRows(opts: {
  user: SessionUser;
  year: number;
  period: Period;
  type?: KpiType;
}): Promise<KpiAnalyticsRow[]> {
  const scope = scopeFilter(opts.user);
  const where = { active: true, ...scope, ...(opts.type ? { type: opts.type } : {}) };

  const kpis = await db.kpi.findMany({
    where,
    include: {
      department: { select: { id: true, name: true } },
      section: { select: { name: true } },
      strategicGoal: { select: { code: true, title: true } },
      operationalGoal: { select: { title: true } },
      targets: { where: { year: opts.year, period: opts.period }, take: 1 },
      entries: {
        where: { year: opts.year, period: opts.period, approvalStatus: "APPROVED" },
        take: 1,
      },
    },
    orderBy: { code: "asc" },
  });

  return kpis.map((kpi) => {
    const target = kpi.targets[0]?.targetValue ?? null;
    const entry = kpi.entries[0];
    const actual = entry?.actualValue ?? null;
    const pct =
      actual != null && target != null
        ? achievementPct(actual, target, kpi.polarity)
        : entry?.achievementPct ?? null;
    const status = entry?.status ?? kpiStatus(pct);

    return {
      kpiId: kpi.id,
      code: kpi.code,
      name: kpi.name,
      unit: kpi.unit,
      baseline: kpi.baseline,
      annualTarget: kpi.annualTarget,
      target,
      actual,
      achievementPct: pct,
      deviationPct: deviationPct(pct),
      status,
      departmentName: kpi.department?.name ?? null,
      departmentId: kpi.department?.id ?? null,
      sectionName: kpi.section?.name ?? null,
      ownerLabel: kpi.ownerLabel,
      strategicGoalCode: kpi.strategicGoal?.code ?? null,
      strategicGoalTitle: kpi.strategicGoal?.title ?? null,
      operationalGoalTitle: kpi.operationalGoal?.title ?? null,
      type: kpi.type,
    };
  });
}

export function statusCounts(rows: KpiAnalyticsRow[]): Record<KpiStatus, number> {
  const counts: Record<KpiStatus, number> = {
    ACHIEVED: 0,
    ON_TRACK: 0,
    AT_RISK: 0,
    CRITICAL: 0,
    NO_DATA: 0,
  };
  for (const r of rows) counts[r.status]++;
  return counts;
}

export function scopedKpiWhere(user: SessionUser) {
  return { active: true, ...scopeFilter(user) };
}
