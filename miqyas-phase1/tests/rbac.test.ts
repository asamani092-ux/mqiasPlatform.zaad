import { describe, expect, it } from "vitest";
import { can, scopeFilter, type SessionUser } from "@/lib/rbac";

function u(role: SessionUser["role"], extra: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "7",
    name: "مستخدم",
    email: "u@zad.org.sa",
    role,
    departmentId: 3,
    sectionId: 5,
    ...extra,
  };
}

describe("rbac.can", () => {
  it("الاعتماد النهائي وإدارة النظام لمشرف النظام فقط", () => {
    expect(can.finalApprove(u("SYSTEM_ADMIN"))).toBe(true);
    for (const role of ["EXECUTIVE", "DEPT_MANAGER", "SECTION_HEAD", "EMPLOYEE"] as const) {
      expect(can.finalApprove(u(role))).toBe(false);
      expect(can.manageUsers(u(role))).toBe(false);
      expect(can.manageKpis(u(role))).toBe(false);
    }
  });

  it("مراجعة الإدارة والإسناد: مشرف أو مدير إدارة", () => {
    expect(can.reviewDepartment(u("DEPT_MANAGER"))).toBe(true);
    expect(can.assignRequirements(u("DEPT_MANAGER"))).toBe(true);
    expect(can.reviewDepartment(u("SECTION_HEAD"))).toBe(false);
    expect(can.assignRequirements(u("EMPLOYEE"))).toBe(false);
  });

  it("قراءة الحوكمة/المعرفة: مشرف أو إدارة عليا — تُحجب عن أدوار الإدخال", () => {
    for (const role of ["SYSTEM_ADMIN", "EXECUTIVE"] as const) {
      expect(can.viewGovernance(u(role))).toBe(true);
      expect(can.viewKnowledge(u(role))).toBe(true);
    }
    for (const role of ["DEPT_MANAGER", "SECTION_HEAD", "EMPLOYEE"] as const) {
      expect(can.viewGovernance(u(role))).toBe(false);
      expect(can.viewKnowledge(u(role))).toBe(false);
    }
  });
});

describe("rbac.scopeFilter", () => {
  it("مشرف/تنفيذي بلا فلتر · مدير بإدارته · رئيس بقسمه · موظف بملكيته", () => {
    expect(scopeFilter(u("SYSTEM_ADMIN"))).toEqual({});
    expect(scopeFilter(u("EXECUTIVE"))).toEqual({});
    expect(scopeFilter(u("DEPT_MANAGER"))).toEqual({ departmentId: 3 });
    expect(scopeFilter(u("SECTION_HEAD"))).toEqual({ sectionId: 5 });
    expect(scopeFilter(u("EMPLOYEE"))).toEqual({ ownerId: 7 });
  });

  it("نطاق فارغ = فلتر مانع (-1) لا فلتر مفتوح", () => {
    expect(scopeFilter(u("DEPT_MANAGER", { departmentId: null }))).toEqual({ departmentId: -1 });
    expect(scopeFilter(u("SECTION_HEAD", { sectionId: null }))).toEqual({ sectionId: -1 });
  });
});
