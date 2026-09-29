import { describe, expect, it } from "vitest";
import { buildNavSections } from "@/lib/nav";
import { can, type SessionUser } from "@/lib/rbac";

function u(role: SessionUser["role"], extra: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "1",
    name: "م",
    email: "a@zad.org.sa",
    role,
    departmentId: 4,
    sectionId: 1,
    sectionCode: null,
    sectionName: null,
    ...extra,
  };
}

describe("مسارات قائمة — لا حذف للمسارات الأساسية", () => {
  it("الموظف العادي: شواهد فقط", () => {
    const hrefs = buildNavSections("EMPLOYEE").flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).toEqual(["/my"]);
  });

  it("موظف مكتب الاستراتيجية: شواهد + مسارات المكتب", () => {
    const hrefs = buildNavSections("EMPLOYEE", { strategyOffice: true }).flatMap((s) =>
      s.items.map((i) => i.href),
    );
    expect(hrefs).toContain("/my");
    expect(hrefs).toContain("/strategy");
    expect(hrefs).toContain("/calendar");
    expect(hrefs).toContain("/governance");
  });

  it("مدير الإدارة يحتفظ بمراجعة وإسناد ويحصل على مكتب الاستراتيجية", () => {
    const hrefs = buildNavSections("DEPT_MANAGER").flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).toContain("/my");
    expect(hrefs).toContain("/dept-follow");
    expect(hrefs).toContain("/admin/assign");
    expect(hrefs).toContain("/strategy");
    expect(hrefs).toContain("/calendar");
  });

  it("مشرف النظام يحتفظ بمسارات الإدارة والتنفيذي", () => {
    const hrefs = buildNavSections("SYSTEM_ADMIN", { showApprovals: true }).flatMap((s) =>
      s.items.map((i) => i.href),
    );
    expect(hrefs).toContain("/executive");
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/my");
    expect(hrefs).toContain("/approvals");
    expect(hrefs).toContain("/admin/users");
    expect(hrefs).toContain("/admin/kpis");
    expect(hrefs).toContain("/strategy");
    expect(hrefs).toContain("/calendar");
  });
});

describe("صلاحيات مكتب الاستراتيجية تراكمية", () => {
  it("مدير الإدارة يرى الحوكمة والاستراتيجية", () => {
    expect(can.viewGovernance(u("DEPT_MANAGER"))).toBe(true);
    expect(can.viewStrategyOffice(u("DEPT_MANAGER"))).toBe(true);
    expect(can.manageStrategyCatalog(u("DEPT_MANAGER"))).toBe(true);
  });

  it("موظف قسم الاستراتيجية يدير الكتالوج والرزنامة", () => {
    const so = u("EMPLOYEE", { sectionCode: "4/1", sectionName: "الاستراتيجية" });
    expect(can.viewStrategyOffice(so)).toBe(true);
    expect(can.manageStrategyCatalog(so)).toBe(true);
    expect(can.manageDeptCalendar(so)).toBe(true);
    expect(can.manageUsers(so)).toBe(false);
    expect(can.finalApprove(so)).toBe(false);
  });

  it("موظف عادي لا يرى مسارات المكتب", () => {
    const emp = u("EMPLOYEE", { sectionCode: "4/2", sectionName: "الموارد البشرية" });
    expect(can.viewGovernance(emp)).toBe(false);
    expect(can.viewStrategyOffice(emp)).toBe(false);
    expect(can.manageStrategyCatalog(emp)).toBe(false);
  });

  it("التنفيذي يحتفظ بقراءة الحوكمة ولا يُسحب منه شيء", () => {
    expect(can.viewGovernance(u("EXECUTIVE"))).toBe(true);
    expect(can.viewKnowledge(u("EXECUTIVE"))).toBe(true);
    expect(can.manageKpis(u("EXECUTIVE"))).toBe(false);
  });
});
