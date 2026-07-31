import type { Prisma, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { roleToFillerRole } from "@/lib/approval-status";
import { isEligibleRequirementOwner } from "@/lib/requirement-owner-scope";

type EnteredBy = {
  id: number;
  role: Role;
  departmentId: number | null;
  sectionId: number | null;
  status?: string;
};

/**
 * إن كان ownerId فارغاً يُعاد ربطه بـ enteredBy إن كان مؤهلاً ضمن إدارة/قسم المتطلب.
 * Time O(1) · Space O(1)
 */
export async function rebindOwnerIfMissing(
  params: {
    requirementId: number;
    ownerId: number | null;
    departmentId: number | null;
    sectionId: number | null;
    enteredBy: EnteredBy;
  },
  tx?: Prisma.TransactionClient
): Promise<number | null> {
  if (params.ownerId != null) return params.ownerId;

  if (!isEligibleRequirementOwner(params.enteredBy, params)) {
    return null;
  }

  const fillerRole = roleToFillerRole(params.enteredBy.role);
  if (!fillerRole) return null;

  const client = tx ?? db;
  await client.measurementRequirement.update({
    where: { id: params.requirementId },
    data: { ownerId: params.enteredBy.id, fillerRole },
  });
  await client.kpi.updateMany({
    where: { requirementId: params.requirementId },
    data: { ownerId: params.enteredBy.id },
  });

  return params.enteredBy.id;
}
