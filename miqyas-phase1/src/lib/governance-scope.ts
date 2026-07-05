import type { Period } from "@prisma/client";
import { db } from "@/lib/db";

export async function governanceStats(year: number, period: Period) {
  const requirements = await db.governanceRequirement.findMany({ where: { year } });
  const totalRequirements = requirements.length;
  const appliedCount = requirements.filter((r) => r.status === "APPLIED").length;
  const notAppliedCount = totalRequirements - appliedCount;
  const compliancePct =
    totalRequirements > 0 ? Math.round((appliedCount / totalRequirements) * 1000) / 10 : 0;

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
    appliedCount,
    compliancePct,
    notAppliedCount,
    openObservations,
    closedInPeriod,
  };
}
