import { db } from "@/lib/db";
import type { Period } from "@prisma/client";
import { deviationPct, resolvePeriods } from "@/lib/kpi";

export async function getMyKpiEntries(userId: number, year: number, period: Period) {
  const kpis = await db.kpi.findMany({
    where: { active: true, ownerId: userId },
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
      baseline: true,
      annualTarget: true,
      polarity: true,
      frequency: true,
      requiredData: true,
      ownerId: true,
      recommendation: true,
      targets: { where: { year, period }, take: 1 },
      entries: {
        where: { year, period },
        take: 1,
        include: {
          evidences: {
            select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
          },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  return kpis.map((kpi) => {
    const entry = kpi.entries[0] ?? null;
    const target = kpi.targets[0] ?? null;
    return {
      kpi: {
        id: kpi.id,
        code: kpi.code,
        name: kpi.name,
        unit: kpi.unit,
        baseline: kpi.baseline,
        annualTarget: kpi.annualTarget,
        polarity: kpi.polarity,
        frequency: kpi.frequency,
        requiredData: kpi.requiredData,
        ownerId: kpi.ownerId,
        recommendation: kpi.recommendation,
      },
      target: target ? { targetValue: target.targetValue } : null,
      entry: entry
        ? {
            id: entry.id,
            actualValue: entry.actualValue,
            achievementPct: entry.achievementPct,
            deviationValue: entry.deviationValue,
            deviationPct: deviationPct(entry.achievementPct),
            status: entry.status,
            whatHappened: entry.whatHappened,
            howHappened: entry.howHappened,
            recommendation: entry.recommendation,
            approvalStatus: entry.approvalStatus,
            rejectReason: entry.rejectReason,
            evidences: entry.evidences,
          }
        : null,
      periods: resolvePeriods(kpi.frequency),
    };
  });
}
