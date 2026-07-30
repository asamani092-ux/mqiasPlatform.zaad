import type { ApprovalStatus, Role } from "@prisma/client";

/** الحالات التي تُعدّ معتمدة نهائياً للتحليلات/اللوحات */
export const FINAL_APPROVED_STATUSES: ApprovalStatus[] = ["FINAL_APPROVED", "APPROVED"];

export function isFinalApproved(status: ApprovalStatus): boolean {
  return status === "FINAL_APPROVED" || status === "APPROVED";
}

/** هل المدخل يستطيع التعديل وإعادة التقديم؟ */
export function canFillerEdit(status: ApprovalStatus): boolean {
  return (
    status === "DRAFT" ||
    status === "SUBMITTED" ||
    status === "REJECTED_WORDING" ||
    status === "REJECTED_EVIDENCE" ||
    status === "REJECTED" ||
    status === "PENDING"
  );
}

/** هل مدير الإدارة يستطيع المراجعة/الاعتماد المبدئي؟ */
export function canDeptReview(status: ApprovalStatus): boolean {
  return status === "SUBMITTED" || status === "PENDING" || status === "INITIAL_APPROVED";
}

/** هل مشرف النظام يرى العنصر للاعتماد النهائي؟ */
export function canFinalReview(status: ApprovalStatus): boolean {
  return status === "INITIAL_APPROVED";
}

export function normalizeLegacyStatus(status: ApprovalStatus): ApprovalStatus {
  if (status === "PENDING") return "SUBMITTED";
  if (status === "APPROVED") return "FINAL_APPROVED";
  if (status === "REJECTED") return "REJECTED_WORDING";
  return status;
}

export const FILLER_ROLES = ["EMPLOYEE", "SECTION_HEAD", "DEPT_MANAGER"] as const;
export type FillerRoleValue = (typeof FILLER_ROLES)[number];

export function roleToFillerRole(role: Role): FillerRoleValue | null {
  if (role === "EMPLOYEE" || role === "SECTION_HEAD" || role === "DEPT_MANAGER") return role;
  return null;
}
