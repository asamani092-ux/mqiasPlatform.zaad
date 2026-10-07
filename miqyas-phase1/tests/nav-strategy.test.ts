import { describe, expect, it } from "vitest";
import { buildNavSections } from "@/lib/nav";
import { can, type SessionUser } from "@/lib/rbac";
import { resolveFeedFlags } from "@/lib/kpi-flags";

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

  it("موظف مكتب الاستراتيجية: مسارات مطوية + كتالوج v2 بدون نموذج كتابة موازٍ", () => {
    const sections = buildNavSections("EMPLOYEE", { strategyOffice: true });
    const tracks = sections.find((s) => s.label === "مسارات القياس");
    expect(tracks?.collapsible).toBe(true);
    expect(tracks?.defaultOpen).toBe(false);
    expect(tracks?.items.map((i) => i.href)).toEqual(["/strategic", "/governance"]);

    const office = sections.find((s) => s.label === "مكتب الاستراتيجية");
    expect(office?.items.map((i) => i.href)).toContain("/strategy");
    expect(office?.items.map((i) => i.href)).toContain("/calendar");
    expect(office?.items.map((i) => i.href)).toContain("/admin/kpis");
    expect(office?.items.find((i) => i.href === "/strategy")?.badge).toBe("v2");
  });

  it("مدير الإدارة يحتفظ بمراجعة وإسناد وإدارة المؤشرات", () => {
    const hrefs = buildNavSections("DEPT_MANAGER").flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).toContain("/my");
    expect(hrefs).toContain("/dept-follow");
    expect(hrefs).toContain("/admin/assign");
    expect(hrefs).toContain("/admin/kpis");
    expect(hrefs).toContain("/strategy");
    expect(hrefs).toContain("/calendar");
  });

  it("مشرف النظام: مسارات القياس مطوية وبلا كتالوج داخلها", () => {
    const tracks = sectionByLabel("SYSTEM_ADMIN", "مسارات القياس", { showApprovals: true });
    const office = sectionByLabel("SYSTEM_ADMIN", "مكتب الاستراتيجية", { showApprovals: true });
    expect(tracks?.collapsible).toBe(true);
    expect(tracks?.defaultOpen).toBe(false);
    expect(tracks?.items.map((i) => i.href)).not.toContain("/strategy");
    expect(tracks?.items.map((i) => i.href)).not.toContain("/calendar");
    expect(tracks?.items.some((i) => i.href === "/strategic")).toBe(true);
    expect(office?.items.map((i) => i.href)).toEqual(["/strategy", "/calendar"]);
    expect(office?.items.every((i) => i.badge === "v2")).toBe(true);
  });

  it("التنفيذي: فصل مسارات القياس عن مكتب الاستراتيجية v2", () => {
    const tracks = sectionByLabel("EXECUTIVE", "مسارات القياس");
    const office = sectionByLabel("EXECUTIVE", "مكتب الاستراتيجية");
    expect(tracks?.collapsible).toBe(true);
    expect(office?.items.map((i) => i.href)).toEqual(["/strategy", "/calendar"]);
  });
});

describe("أوسمة التغذية", () => {
  it("يسمح باستراتيجي وحوكمة معاً", () => {
    const f = resolveFeedFlags({
      type: "STRATEGIC",
      feedsStrategic: true,
      isGovernanceRequirement: true,
    });
    expect(f.feedsStrategic).toBe(true);
    expect(f.isGovernanceRequirement).toBe(true);
    expect(f.domain).toBe("STRATEGIC");
  });

  it("حوكمة فقط لا تغذي الاستراتيجية", () => {
    const f = resolveFeedFlags({
      type: "STRATEGIC",
      feedsStrategic: false,
      isGovernanceRequirement: true,
    });
    expect(f.feedsStrategic).toBe(false);
    expect(f.isGovernanceRequirement).toBe(true);
    expect(f.domain).toBe("GOVERNANCE");
  });

  it("التشغيلي لا يغذي الاستراتيجية", () => {
    const f = resolveFeedFlags({ type: "OPERATIONAL" });
    expect(f.feedsStrategic).toBe(false);
    expect(f.domain).toBe("OPERATIONAL");
  });
});

describe("صلاحيات مكتب الاستراتيجية تراكمية", () => {
  it("مدير الإدارة يرى الحوكمة ويكتب المؤشرات", () => {
    expect(can.viewGovernance(u("DEPT_MANAGER"))).toBe(true);
    expect(can.viewStrategyOffice(u("DEPT_MANAGER"))).toBe(true);
    expect(can.writeKpis(u("DEPT_MANAGER"))).toBe(true);
    expect(can.manageKpis(u("DEPT_MANAGER"))).toBe(false);
  });

  it("موظف قسم الاستراتيجية يدير الكتالوج والرزنامة ويكتب المؤشرات", () => {
    const so = u("EMPLOYEE", { sectionCode: "4/1", sectionName: "الاستراتيجية" });
    expect(can.viewStrategyOffice(so)).toBe(true);
    expect(can.manageStrategyCatalog(so)).toBe(true);
    expect(can.writeKpis(so)).toBe(true);
    expect(can.manageDeptCalendar(so)).toBe(true);
    expect(can.manageUsers(so)).toBe(false);
  });

  it("موظف عادي لا يرى مسارات المكتب", () => {
    const emp = u("EMPLOYEE", { sectionCode: "4/2", sectionName: "الموارد البشرية" });
    expect(can.viewGovernance(emp)).toBe(false);
    expect(can.viewStrategyOffice(emp)).toBe(false);
    expect(can.writeKpis(emp)).toBe(false);
  });

  it("التنفيذي يحتفظ بقراءة الحوكمة ولا يُسحب منه شيء", () => {
    expect(can.viewGovernance(u("EXECUTIVE"))).toBe(true);
    expect(can.viewKnowledge(u("EXECUTIVE"))).toBe(true);
    expect(can.manageKpis(u("EXECUTIVE"))).toBe(false);
  });
});
