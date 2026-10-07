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

function sectionByLabel(role: SessionUser["role"], label: string, flags = {}) {
  return buildNavSections(role, flags).find((s) => s.label === label);
}

describe("مسارات قائمة — لا حذف للمسارات الأساسية", () => {
  it("الموظف العادي: شواهد فقط", () => {
    const hrefs = buildNavSections("EMPLOYEE").flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).toEqual(["/my"]);
  });

  it("موظف مكتب الاستراتيجية: شواهد + قسم المكتب مع وسم v2 على الأدوات الجديدة", () => {
    const sections = buildNavSections("EMPLOYEE", { strategyOffice: true });
    const hrefs = sections.flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).toContain("/my");
    expect(hrefs).toContain("/strategy");
    expect(hrefs).toContain("/calendar");
    expect(hrefs).toContain("/governance");

    const office = sectionByLabel("EMPLOYEE", "مكتب الاستراتيجية", { strategyOffice: true });
    expect(office).toBeTruthy();
    const catalog = office!.items.find((i) => i.href === "/strategy");
    const calendar = office!.items.find((i) => i.href === "/calendar");
    const strategic = office!.items.find((i) => i.href === "/strategic");
    expect(catalog?.badge).toBe("v2");
    expect(calendar?.badge).toBe("v2");
    expect(strategic?.badge).toBeUndefined();
  });

  it("مدير الإدارة يحتفظ بمراجعة وإسناد ويحصل على مكتب الاستراتيجية", () => {
    const hrefs = buildNavSections("DEPT_MANAGER").flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).toContain("/my");
    expect(hrefs).toContain("/dept-follow");
    expect(hrefs).toContain("/admin/assign");
    expect(hrefs).toContain("/strategy");
    expect(hrefs).toContain("/calendar");
  });

  it("مشرف النظام: مسارات القياس بلا كتالوج/رزنامة وقسم مكتب منفصل بوسم v2", () => {
    const sections = buildNavSections("SYSTEM_ADMIN", { showApprovals: true });
    const hrefs = sections.flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).toContain("/executive");
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/my");
    expect(hrefs).toContain("/approvals");
    expect(hrefs).toContain("/admin/users");
    expect(hrefs).toContain("/admin/kpis");
    expect(hrefs).toContain("/strategy");
    expect(hrefs).toContain("/calendar");

    const tracks = sectionByLabel("SYSTEM_ADMIN", "مسارات القياس", { showApprovals: true });
    const office = sectionByLabel("SYSTEM_ADMIN", "مكتب الاستراتيجية", { showApprovals: true });
    expect(tracks?.items.map((i) => i.href)).not.toContain("/strategy");
    expect(tracks?.items.map((i) => i.href)).not.toContain("/calendar");
    expect(office?.items.map((i) => i.href)).toEqual(["/strategy", "/calendar"]);
    expect(office?.items.every((i) => i.badge === "v2")).toBe(true);
  });

  it("التنفيذي: فصل مسارات القياس عن مكتب الاستراتيجية v2", () => {
    const tracks = sectionByLabel("EXECUTIVE", "مسارات القياس");
    const office = sectionByLabel("EXECUTIVE", "مكتب الاستراتيجية");
    expect(tracks?.items.some((i) => i.href === "/strategic")).toBe(true);
    expect(tracks?.items.some((i) => i.badge === "v2")).toBe(false);
    expect(office?.items.map((i) => i.href)).toEqual(["/strategy", "/calendar"]);
    expect(office?.items.every((i) => i.badge === "v2")).toBe(true);
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
