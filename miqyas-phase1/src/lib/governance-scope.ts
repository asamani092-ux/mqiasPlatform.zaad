import type { Period } from "@prisma/client";
import { db } from "@/lib/db";

/** Time O(n), Space O(1) على عدد المتطلبات */
export async function governanceStats(year: number, period: Period) {
  const requirements = await db.governanceRequirement.findMany({ where: { year } });
  const totalRequirements = requirements.length;
  const compliantCount = requirements.filter((r) => r.status === "COMPLIANT").length;
  const partialCount = requirements.filter((r) => r.status === "PARTIAL").length;
  const notCompliantCount = requirements.filter((r) => r.status === "NON_COMPLIANT").length;
  const pendingCount = requirements.filter((r) => r.status === "PENDING").length;
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
    partialCount,
    notCompliantCount,
    pendingCount,
    compliancePct,
    openObservations,
    closedInPeriod,
  };
}
