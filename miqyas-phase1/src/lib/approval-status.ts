import type { ApprovalStatus, Role } from "@prisma/client";

/** الحالات التي تُعدّ معتمدة نهائياً للتحليلات/اللوحات */
export const FINAL_APPROVED_STATUSES: ApprovalStatus[] = ["FINAL_APPROVED", "APPROVED"];

export function isFinalApproved(status: ApprovalStatus): boolean {
  return status === "FINAL_APPROVED" || status === "APPROVED";
}

/** هل المدخل يستطيع التعديل وإعادة التقديم؟ (بعد التقديم يُقفل حتى الرفض/الإرجاع) */
export function canFillerEdit(status: ApprovalStatus): boolean {
  return (
    status === "DRAFT" ||
    status === "REJECTED_WORDING" ||
    status === "REJECTED_EVIDENCE" ||
    status === "REJECTED"
  );
}

/** هل القياس بانتظار مراجعة الإدارة؟ */
export function isAwaitingDept(status: ApprovalStatus): boolean {
  return status === "SUBMITTED" || status === "PENDING";
}

/** هل مدير الإدارة يستطيع المراجعة/الاعتماد المبدئي؟ */
export function canDeptReview(status: ApprovalStatus): boolean {
  return status === "SUBMITTED" || status === "PENDING" || status === "INITIAL_APPROVED";
}

/** هل يمكن إرجاع القياس للتعديل من الإدارة؟ */
export function canDeptReturn(status: ApprovalStatus): boolean {
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

/** DRAFT مع سبب إرجاع = أُعيد للتعديل */
export function isReturnedDraft(status: ApprovalStatus, rejectReason?: string | null): boolean {
  return status === "DRAFT" && !!rejectReason?.trim();
}

export function displayApprovalLabel(
  status: ApprovalStatus | string | null | undefined,
  rejectReason?: string | null
): string {
  if (!status) return "جديد";
  if (isReturnedDraft(status as ApprovalStatus, rejectReason)) return "أُعيد للتعديل";
  const map: Record<string, string> = {
    DRAFT: "مسودة",
    SUBMITTED: "مقدَّم",
    INITIAL_APPROVED: "معتمد مبدئياً",
    FINAL_APPROVED: "معتمد نهائياً",
    REJECTED_WORDING: "مرفوض صياغة",
    REJECTED_EVIDENCE: "مرفوض شواهد",
    PENDING: "مقدَّم",
    APPROVED: "معتمد نهائياً",
    REJECTED: "مرفوض صياغة",
  };
  return map[status] ?? status;
}

export const FILLER_ROLES = ["EMPLOYEE", "SECTION_HEAD", "DEPT_MANAGER"] as const;
export type FillerRoleValue = (typeof FILLER_ROLES)[number];

export function roleToFillerRole(role: Role): FillerRoleValue | null {
  if (role === "EMPLOYEE" || role === "SECTION_HEAD" || role === "DEPT_MANAGER") return role;
  return null;
}
