import type { Role } from "@prisma/client";
import { roleToFillerRole } from "@/lib/approval-status";

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
  /** الاعتماد النهائي — مشرف النظام فقط */
  finalApprove: (u: SessionUser) => isAdmin(u),
  /** اعتماد نهائي (اسم قديم للتوافق مع الواجهات) */
  approveEntries: (u: SessionUser) => isAdmin(u),
  manageDeviation: (u: SessionUser) => isAdmin(u) || u.role === "EXECUTIVE",
  manageKnowledge: (u: SessionUser) => isAdmin(u),
  enterOwnKpis: (_u: SessionUser) => true,
  /** مراجعة الإدارة: اعتماد مبدئي + تعديل السرد */
  reviewDepartment: (u: SessionUser) => isAdmin(u) || u.role === "DEPT_MANAGER",
  /** متابعة/مراجعة مؤشرات الإدارة */
  followDepartment: (u: SessionUser) => isAdmin(u) || u.role === "DEPT_MANAGER",
  /** إسناد جماعي للمتطلبات */
  assignRequirements: (u: SessionUser) => isAdmin(u),
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

/** نطاق متطلبات القياس للكتابة في شواهد المؤشرات */
export function requirementOwnerFilter(u: SessionUser): Record<string, unknown> {
  const fillerRole = roleToFillerRole(u.role);
  const base: Record<string, unknown> = {
    ownerId: parseInt(u.id, 10),
    active: true,
  };
  if (fillerRole) base.fillerRole = fillerRole;
  return base;
}
