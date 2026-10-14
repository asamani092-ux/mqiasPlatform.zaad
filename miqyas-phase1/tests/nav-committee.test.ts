import { describe, expect, it } from "vitest";
import { buildNavSections } from "@/lib/nav";
import { can, isCommittee, type SessionUser } from "@/lib/rbac";
import { ROLE_LABEL, ROLE_VALUES } from "@/lib/types";
import { resolveToolPhase } from "@/lib/phase-registry";

function u(role: SessionUser["role"]): SessionUser {
  return {
    id: "3",
    name: "لجنة",
    email: "c@zad.org.sa",
    role,
    departmentId: null,
    sectionId: null,
  };
}

describe("م3 — دور اللجنة", () => {
  it("AUDIT_COMMITTEE في الأدوار", () => {
    expect(ROLE_VALUES).toContain("AUDIT_COMMITTEE");
    expect(ROLE_LABEL.AUDIT_COMMITTEE).toBe("عضو لجنة المراجعة");
  });

  it("عضو اللجنة: قسم اللجنة فقط بلا أوراق عمل", () => {
    const sections = buildNavSections("AUDIT_COMMITTEE");
    expect(sections.map((s) => s.label)).toEqual(["لجنة المراجعة"]);
    const hrefs = sections[0]!.items.map((i) => i.href);
    expect(hrefs).toEqual([
      "/committee",
      "/committee/meetings",
      "/committee/minutes",
      "/committee/decisions",
      "/committee/inbox",
    ]);
    expect(hrefs).not.toContain("/audit/papers");
    expect(sections[0]!.items.every((i) => i.badge === "m3")).toBe(true);
  });

  it("المراجع يرى المراجعة واللجنة", () => {
    const labels = buildNavSections("INTERNAL_AUDITOR").map((s) => s.label);
    expect(labels).toContain("المراجعة الداخلية");
    expect(labels).toContain("لجنة المراجعة");
  });
});

describe("م3 — الصلاحيات", () => {
  it("اللجنة تدير المحاضر ولا ترى أوراق العمل", () => {
    expect(isCommittee(u("AUDIT_COMMITTEE"))).toBe(true);
    expect(can.manageCommittee(u("AUDIT_COMMITTEE"))).toBe(true);
    expect(can.manageAuditPapers(u("AUDIT_COMMITTEE"))).toBe(false);
    expect(can.viewCommittee(u("AUDIT_COMMITTEE"))).toBe(true);
  });

  it("المراجع يقرأ اللجنة ولا يديرها", () => {
    expect(can.viewCommittee(u("INTERNAL_AUDITOR"))).toBe(true);
    expect(can.manageCommittee(u("INTERNAL_AUDITOR"))).toBe(false);
    expect(can.manageAuditPapers(u("INTERNAL_AUDITOR"))).toBe(true);
  });

  it("التنفيذي يقرأ ولا يدير", () => {
    expect(can.viewCommittee(u("EXECUTIVE"))).toBe(true);
    expect(can.manageCommittee(u("EXECUTIVE"))).toBe(false);
    expect(can.manageAuditPapers(u("EXECUTIVE"))).toBe(false);
  });
});

describe("م3 — سجل المراحل", () => {
  it("مسارات اللجنة موسومة م3", () => {
    expect(resolveToolPhase("/committee")?.phase).toBe("m3");
    expect(resolveToolPhase("/committee/inbox")?.phase).toBe("m3");
    expect(resolveToolPhase("/audit/papers")?.phase).toBe("m2");
  });
});
