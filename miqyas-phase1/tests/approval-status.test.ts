import { describe, expect, it } from "vitest";
import {
  FINAL_APPROVED_STATUSES,
  canDeptReview,
  canFillerEdit,
  canFinalReview,
  displayApprovalLabel,
  isFinalApproved,
  isReturnedDraft,
  normalizeLegacyStatus,
  roleToFillerRole,
} from "@/lib/approval-status";

describe("approval-status", () => {
  it("النهائي = FINAL_APPROVED أو APPROVED القديمة فقط", () => {
    expect(isFinalApproved("FINAL_APPROVED")).toBe(true);
    expect(isFinalApproved("APPROVED")).toBe(true);
    expect(isFinalApproved("SUBMITTED")).toBe(false);
    expect(isFinalApproved("INITIAL_APPROVED")).toBe(false);
    expect(FINAL_APPROVED_STATUSES).toEqual(["FINAL_APPROVED", "APPROVED"]);
  });

  it("المدخل يعدّل في المسودة وحالات الرفض فقط — يُقفل بعد التقديم", () => {
    expect(canFillerEdit("DRAFT")).toBe(true);
    expect(canFillerEdit("REJECTED_WORDING")).toBe(true);
    expect(canFillerEdit("REJECTED_EVIDENCE")).toBe(true);
    expect(canFillerEdit("SUBMITTED")).toBe(false);
    expect(canFillerEdit("INITIAL_APPROVED")).toBe(false);
    expect(canFillerEdit("FINAL_APPROVED")).toBe(false);
  });

  it("مراجعة الإدارة على المقدَّم والمعتمد مبدئياً · النهائي على المبدئي فقط", () => {
    expect(canDeptReview("SUBMITTED")).toBe(true);
    expect(canDeptReview("INITIAL_APPROVED")).toBe(true);
    expect(canDeptReview("DRAFT")).toBe(false);
    expect(canFinalReview("INITIAL_APPROVED")).toBe(true);
    expect(canFinalReview("SUBMITTED")).toBe(false);
    expect(canFinalReview("FINAL_APPROVED")).toBe(false);
  });

  it("تطبيع الحالات القديمة", () => {
    expect(normalizeLegacyStatus("PENDING")).toBe("SUBMITTED");
    expect(normalizeLegacyStatus("APPROVED")).toBe("FINAL_APPROVED");
    expect(normalizeLegacyStatus("REJECTED")).toBe("REJECTED_WORDING");
    expect(normalizeLegacyStatus("DRAFT")).toBe("DRAFT");
  });

  it("مسودة مع سبب إرجاع = أُعيد للتعديل", () => {
    expect(isReturnedDraft("DRAFT", "سبب")).toBe(true);
    expect(isReturnedDraft("DRAFT", "  ")).toBe(false);
    expect(isReturnedDraft("DRAFT", null)).toBe(false);
    expect(displayApprovalLabel("DRAFT", "سبب")).toBe("أُعيد للتعديل");
    expect(displayApprovalLabel("DRAFT")).toBe("مسودة");
  });

  it("fillerRole لأدوار الإدخال فقط", () => {
    expect(roleToFillerRole("EMPLOYEE")).toBe("EMPLOYEE");
    expect(roleToFillerRole("SECTION_HEAD")).toBe("SECTION_HEAD");
    expect(roleToFillerRole("DEPT_MANAGER")).toBe("DEPT_MANAGER");
    expect(roleToFillerRole("SYSTEM_ADMIN")).toBeNull();
    expect(roleToFillerRole("EXECUTIVE")).toBeNull();
  });
});
