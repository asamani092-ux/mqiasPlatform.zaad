import { describe, expect, it } from "vitest";
import { previousPeriod } from "@/lib/knowledge-scope";

describe("previousPeriod", () => {
  it("الأرباع تنتقل بشكل صحيح عبر السنة", () => {
    expect(previousPeriod(2026, "Q1")).toEqual({ year: 2025, period: "Q4" });
    expect(previousPeriod(2026, "Q2")).toEqual({ year: 2026, period: "Q1" });
    expect(previousPeriod(2026, "Q3")).toEqual({ year: 2026, period: "Q2" });
    expect(previousPeriod(2026, "Q4")).toEqual({ year: 2026, period: "Q3" });
  });

  it("النصف سنوي والسنوي", () => {
    expect(previousPeriod(2026, "H1")).toEqual({ year: 2025, period: "H2" });
    expect(previousPeriod(2026, "H2")).toEqual({ year: 2026, period: "H1" });
    expect(previousPeriod(2026, "Y")).toEqual({ year: 2025, period: "Y" });
  });
});
