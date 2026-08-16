import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient | typeof db;

/**
 * مزامنة مالك المؤشر → متطلب القياس الموحّد.
 * زمن: O(1) · مكان: O(1)
 */
export async function syncRequirementOwnerFromKpi(
  kpi: { id: number; code: string; ownerId: number | null; requirementId: number | null },
  tx: Tx = db,
): Promise<void> {
  if (kpi.requirementId != null) {
    await tx.measurementRequirement.update({
      where: { id: kpi.requirementId },
      data: { ownerId: kpi.ownerId },
    });
    return;
  }

  const byCode = await tx.measurementRequirement.findUnique({
    where: { code: kpi.code },
    select: { id: true },
  });
  if (!byCode) return;

  await tx.measurementRequirement.update({
    where: { id: byCode.id },
    data: { ownerId: kpi.ownerId },
  });
  await tx.kpi.update({
    where: { id: kpi.id },
    data: { requirementId: byCode.id },
  });
}
