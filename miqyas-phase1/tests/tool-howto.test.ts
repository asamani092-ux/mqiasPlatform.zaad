import { describe, expect, it } from "vitest";
import { TOOLS, resolveToolPhase } from "@/lib/phase-registry";

describe("شرح الأدوات", () => {
  it("كل أداة مسجّلة لها جملة كيف تعمل", () => {
    expect(TOOLS.length).toBeGreaterThan(20);
    for (const tool of TOOLS) {
      expect(tool.meta.howTo.trim().length, tool.prefix).toBeGreaterThan(8);
    }
  });

  it("الشرح يظهر على أطول بادئة", () => {
    expect(resolveToolPhase("/audit/papers")?.howTo).toContain("سرية");
    expect(resolveToolPhase("/committee")?.howTo).toContain("أوراق العمل");
    expect(resolveToolPhase("/admin/kpis")?.name).toBe("إدارة المؤشرات");
  });
});
