import type { Role } from "@prisma/client";
import { roleToFillerRole } from "@/lib/approval-status";

type PersonScope = {
  role: string;
  departmentId: number | null;
  sectionId: number | null;
  status?: string;
};

/** هل الشخص مؤهل ليكون مالكاً لنطاق المتطلب */
export function isEligibleRequirementOwner(
  person: PersonScope & { role: Role | string },
  requirement: { departmentId: number | null; sectionId: number | null }
): boolean {
  if (person.status && person.status !== "ACTIVE") return false;
  const filler = roleToFillerRole(person.role as Role);
  if (!filler) return false;
  if (filler === "SECTION_HEAD") {
    if (requirement.sectionId != null) return person.sectionId === requirement.sectionId;
    return (
      requirement.departmentId == null || person.departmentId === requirement.departmentId
    );
  }
  if (requirement.departmentId != null && person.departmentId !== requirement.departmentId) {
    return false;
  }
  return true;
}

/** مرشحو الإسناد لنطاق متطلب — Time O(n) · Space O(n) */
export function filterAssignCandidates<T extends PersonScope>(
  users: T[],
  requirement: { departmentId: number | null; sectionId: number | null }
): T[] {
  return users.filter((u) => {
    if (u.role === "SECTION_HEAD") {
      if (requirement.sectionId != null) return u.sectionId === requirement.sectionId;
      return (
        requirement.departmentId == null || u.departmentId === requirement.departmentId
      );
    }
    if (u.role === "EMPLOYEE" || u.role === "DEPT_MANAGER") {
      return (
        requirement.departmentId == null || u.departmentId === requirement.departmentId
      );
    }
    return false;
  });
}
