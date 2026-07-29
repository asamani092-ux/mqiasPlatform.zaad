import type { Period } from "@prisma/client";
import { db } from "@/lib/db";

export async function governanceStats(year: number, period: Period) {
  const requirements = await db.governanceRequirement.findMany({ where: { year } });
  const totalRequirements = requirements.length;
  const compliantCount = requirements.filter((r) => r.status === "COMPLIANT").length;
  const notCompliantCount = requirements.filter((r) => r.status === "NON_COMPLIANT").length;
  const compliancePct =
    totalRequirements > 0
      ? Math.round(
          (requirements.reduce((sum, r) => sum + r.compliancePct, 0) / totalRequirements) * 10
        ) / 10
      : 0;

  const openObservations = await db.governanceObservation.count({ where: { status: "OPEN" } });
  const closedInPeriod = await db.governanceObservation.count({
    where: {
      status: "CLOSED",
      closedYear: year,
      closedPeriod: period,
    },
  });

  return {
    totalRequirements,
    compliantCount,
    compliancePct,
    notCompliantCount,
    openObservations,
    closedInPeriod,
  };
}
