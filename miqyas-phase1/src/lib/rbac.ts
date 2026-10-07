import type { Role } from "@prisma/client";
import { roleToFillerRole } from "@/lib/approval-status";
import { isStrategySectionMeta } from "@/lib/strategy-meta";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: number | null;
  sectionId: number | null;
  /** يُملأ من إعادة التحقق — لكشف مكتب الاستراتيجية دون استعلام إضافي */
  sectionCode?: string | null;
  sectionName?: string | null;
};

function isAdmin(u: SessionUser) {
  return u.role === "SYSTEM_ADMIN";
}

/** عضو مكتب الاستراتيجية من بيانات الجلسة فقط (بدون I/O) */
export function isStrategyOfficeFromSession(u: SessionUser): boolean {
  if (isAdmin(u)) return true;
  return isStrategySectionMeta({ code: u.sectionCode, name: u.sectionName });
}

export const can = {
  manageUsers: (u: SessionUser) => isAdmin(u),
  manageStructure: (u: SessionUser) => isAdmin(u),
  /** إدارة كاملة للمؤشرات — مشرف النظام (إعدادات/تقارير/استيراد) */
  manageKpis: (u: SessionUser) => isAdmin(u),
  /**
   * كتابة تعريف المؤشر في الواجهة الموحّدة — مشرف أو مكتب الاستراتيجية أو مدير إدارة
   * (نطاق الإدارة يُفرض في الصفحة والـ API)
   */
  writeKpis: (u: SessionUser) =>
    isAdmin(u) || isStrategyOfficeFromSession(u) || u.role === "DEPT_MANAGER",
  manageGovernance: (u: SessionUser) => isAdmin(u) || isStrategyOfficeFromSession(u),
  viewExecutive: (u: SessionUser) => isAdmin(u) || u.role === "EXECUTIVE",
  /** الاعتماد النهائي — مشرف النظام فقط */
  finalApprove: (u: SessionUser) => isAdmin(u),
  /** اعتماد نهائي (اسم قديم للتوافق مع الواجهات) */
  approveEntries: (u: SessionUser) => isAdmin(u),
  manageDeviation: (u: SessionUser) => isAdmin(u) || u.role === "EXECUTIVE",
  manageKnowledge: (u: SessionUser) => isAdmin(u),
  /**
   * قراءة مسار الحوكمة — مشرف / تنفيذي / مدراء ورؤساء أقسام / مكتب الاستراتيجية
   * (توسيع تراكمي دون سحب صلاحيات سابقة)
   */
  viewGovernance: (u: SessionUser) =>
    isAdmin(u) ||
    u.role === "EXECUTIVE" ||
    u.role === "DEPT_MANAGER" ||
    u.role === "SECTION_HEAD" ||
    isStrategyOfficeFromSession(u),
  /** قراءة مسار المعرفة — بما يطابق حجب الصفحة عن أدوار الإدخال العامة */
  viewKnowledge: (u: SessionUser) => isAdmin(u) || u.role === "EXECUTIVE",
  /** مكتب الاستراتيجية: مسارات الاستراتيجية/الحوكمة/الرزنامة/الكتالوج */
  viewStrategyOffice: (u: SessionUser) =>
    isAdmin(u) ||
    u.role === "EXECUTIVE" ||
    u.role === "DEPT_MANAGER" ||
    u.role === "SECTION_HEAD" ||
    isStrategyOfficeFromSession(u),
  /**
   * تعديل كتالوج المؤشرات/المتطلبات الاستراتيجية والحوكمة
   * مشرف أو مكتب الاستراتيجية أو مدير إدارة (نطاق إدارته يُفرض في الـ API)
   */
  manageStrategyCatalog: (u: SessionUser) =>
    isAdmin(u) || isStrategyOfficeFromSession(u) || u.role === "DEPT_MANAGER",
  /** إدارة رزنامة القسم */
  manageDeptCalendar: (u: SessionUser) =>
    isAdmin(u) || isStrategyOfficeFromSession(u),
  /** قراءة الرزنامة */
  viewDeptCalendar: (u: SessionUser) =>
    isAdmin(u) ||
    u.role === "EXECUTIVE" ||
    u.role === "DEPT_MANAGER" ||
    u.role === "SECTION_HEAD" ||
    isStrategyOfficeFromSession(u),
  enterOwnKpis: (_u: SessionUser) => true,
  /** مراجعة الإدارة: اعتماد مبدئي + تعديل السرد */
  reviewDepartment: (u: SessionUser) => isAdmin(u) || u.role === "DEPT_MANAGER",
  /** متابعة/مراجعة مؤشرات الإدارة */
  followDepartment: (u: SessionUser) => isAdmin(u) || u.role === "DEPT_MANAGER",
  /** إسناد المتطلبات — مشرف أو مدير إدارة */
  assignRequirements: (u: SessionUser) => isAdmin(u) || u.role === "DEPT_MANAGER",
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
  if (u.role === "SECTION_HEAD" && u.sectionId != null) {
    base.sectionId = u.sectionId;
  } else if (u.departmentId != null) {
    base.departmentId = u.departmentId;
  }
  return base;
}
