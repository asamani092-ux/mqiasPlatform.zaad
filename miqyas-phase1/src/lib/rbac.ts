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
  /** اعتماد القياسات: مشرف دائماً؛ رئيس قسم/مدير إدارة حسب الإعدادات */
  approveEntries: (
    u: SessionUser,
    opts: { sectionHeadDelegation?: boolean; deptManagerDelegation?: boolean } = {}
  ) => {
    if (isAdmin(u)) return true;
    if (opts.sectionHeadDelegation && u.role === "SECTION_HEAD") return true;
    if (opts.deptManagerDelegation && u.role === "DEPT_MANAGER") return true;
    return false;
  },
  manageDeviation: (u: SessionUser) => isAdmin(u) || u.role === "EXECUTIVE",
  manageKnowledge: (u: SessionUser) => isAdmin(u),
  enterOwnKpis: (_u: SessionUser) => true,
  /** متابعة مؤشرات الإدارة (قراءة) لمدير الإدارة */
  followDepartment: (u: SessionUser) => isAdmin(u) || u.role === "DEPT_MANAGER",
};

/** نطاق مؤشرات KPI للمسارات التحليلية */
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

/** نطاق متطلبات القياس للكتابة في /my */
export function requirementOwnerFilter(u: SessionUser): Record<string, unknown> {
  return { ownerId: parseInt(u.id, 10), active: true };
}
