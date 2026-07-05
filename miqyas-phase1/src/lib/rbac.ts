import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: number | null;
  sectionId: number | null;
};

function isAdmin(u: SessionUser) {
  return u.role === "SYSTEM_ADMIN";
}

export const can = {
  manageUsers: (u: SessionUser) => isAdmin(u),
  manageStructure: (u: SessionUser) => isAdmin(u),
  manageKpis: (u: SessionUser) => isAdmin(u),
  manageGovernance: (u: SessionUser) => isAdmin(u),
  viewExecutive: (u: SessionUser) => isAdmin(u) || u.role === "EXECUTIVE",
  approveEntries: (u: SessionUser, delegationOn: boolean) =>
    isAdmin(u) || (delegationOn && u.role === "SECTION_HEAD"),
  manageDeviation: (u: SessionUser) =>
    isAdmin(u) || u.role === "DEPT_MANAGER" || u.role === "SECTION_HEAD",
  manageKnowledge: (u: SessionUser) =>
    isAdmin(u) || u.role === "DEPT_MANAGER" || u.role === "SECTION_HEAD",
  enterOwnKpis: (_u: SessionUser) => true,
};

export function scopeFilter(u: SessionUser): Record<string, unknown> {
  switch (u.role) {
    case "SYSTEM_ADMIN":
    case "EXECUTIVE":
      return {};
    case "DEPT_MANAGER":
      return u.departmentId != null ? { departmentId: u.departmentId } : { departmentId: -1 };
    case "SECTION_HEAD":
      return u.sectionId != null ? { sectionId: u.sectionId } : { sectionId: -1 };
    case "EMPLOYEE":
      return { ownerId: parseInt(u.id, 10) };
    default:
      return { ownerId: -1 };
  }
}
