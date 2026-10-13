import { describe, expect, it } from "vitest";
import { buildNavSections } from "@/lib/nav";
import { can, isAuditTeam, type SessionUser } from "@/lib/rbac";
import { ROLE_LABEL, ROLE_VALUES } from "@/lib/types";
import { resolveToolPhase } from "@/lib/phase-registry";

function u(role: SessionUser["role"], extra: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "2",
    name: "مراجع",
    email: "audit@zad.org.sa",
    role,
    departmentId: null,
    sectionId: null,
    ...extra,
  };
}

describe("م2 — دور المراجع والتنقّل", () => {
  it("INTERNAL_AUDITOR ضمن ROLE_VALUES وله تسمية عربية", () => {
    expect(ROLE_VALUES).toContain("INTERNAL_AUDITOR");
    expect(ROLE_LABEL.INTERNAL_AUDITOR).toBe("مراجع داخلي");
  });

  it("المراجع: قسم المراجعة فقط مع أوراق العمل", () => {
    const sections = buildNavSections("INTERNAL_AUDITOR");
    expect(sections).toHaveLength(1);
    expect(sections[0]?.label).toBe("المراجعة الداخلية");
    const hrefs = sections[0]!.items.map((i) => i.href);
    expect(hrefs).toEqual([
      "/audit",
      "/audit/plan",
      "/audit/engagements",
      "/audit/findings",
      "/audit/reports",
      "/audit/papers",
    ]);
    expect(sections[0]!.items.every((i) => i.badge === "m2")).toBe(true);
  });

  it("التنفيذي يرى الملخص والتقارير بلا أوراق العمل", () => {
    const audit = buildNavSections("EXECUTIVE").find((s) => s.label === "المراجعة الداخلية");
    const hrefs = audit?.items.map((i) => i.href) ?? [];
    expect(hrefs).toContain("/audit");
    expect(hrefs).toContain("/audit/reports");
    expect(hrefs).not.toContain("/audit/papers");
  });

  it("المشرف يحتفظ بمسارات القياس ويحصل على أوراق العمل", () => {
    const sections = buildNavSections("SYSTEM_ADMIN", { showApprovals: true });
    expect(sections.some((s) => s.label === "مسارات القياس")).toBe(true);
    const audit = sections.find((s) => s.label === "المراجعة الداخلية");
    expect(audit?.items.map((i) => i.href)).toContain("/audit/papers");
  });
});

describe("م2 — صلاحيات أوراق العمل", () => {
  it("فريق المراجعة: مشرف أو مراجع", () => {
    expect(isAuditTeam(u("SYSTEM_ADMIN"))).toBe(true);
    expect(isAuditTeam(u("INTERNAL_AUDITOR"))).toBe(true);
    expect(isAuditTeam(u("EXECUTIVE"))).toBe(false);
  });

  it("التنفيذي يرى المكتب ولا يدير الأوراق", () => {
    expect(can.viewAuditOffice(u("EXECUTIVE"))).toBe(true);
    expect(can.manageAuditPapers(u("EXECUTIVE"))).toBe(false);
    expect(can.manageAuditPlan(u("EXECUTIVE"))).toBe(false);
  });

  it("المراجع يدير الخطة والأوراق", () => {
    expect(can.manageAuditPlan(u("INTERNAL_AUDITOR"))).toBe(true);
    expect(can.manageAuditPapers(u("INTERNAL_AUDITOR"))).toBe(true);
    expect(can.manageAuditFindings(u("INTERNAL_AUDITOR"))).toBe(true);
  });

  it("موظف عادي بلا وصول للمراجعة", () => {
    expect(can.viewAuditOffice(u("EMPLOYEE"))).toBe(false);
    expect(can.manageAuditPapers(u("DEPT_MANAGER"))).toBe(false);
  });
});

describe("م2 — سجل المراحل", () => {
  it("مسارات /audit موسومة م2", () => {
    expect(resolveToolPhase("/audit")?.phase).toBe("m2");
    expect(resolveToolPhase("/audit/papers")?.phase).toBe("m2");
    expect(resolveToolPhase("/audit/plan")?.name).toContain("الخطة");
  });
});
