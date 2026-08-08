import { describe, expect, it } from "vitest";
import {
  achievementPct,
  deviationPct,
  deviationValue,
  frequenciesForPeriod,
  kpiStatus,
  resolvePeriods,
} from "@/lib/kpi";

describe("kpi math", () => {
  it("نسبة الإنجاز — الأعلى أفضل", () => {
    expect(achievementPct(80, 100, "HIGHER_BETTER")).toBe(80);
    expect(achievementPct(120, 100, "HIGHER_BETTER")).toBe(120);
    expect(achievementPct(1, 3, "HIGHER_BETTER")).toBe(33.3);
  });

  it("نسبة الإنجاز — الأدنى أفضل (معكوسة)", () => {
    expect(achievementPct(50, 100, "LOWER_BETTER")).toBe(200);
    expect(achievementPct(200, 100, "LOWER_BETTER")).toBe(50);
  });

  it("حالات القسمة على صفر تعيد null لا NaN", () => {
    expect(achievementPct(50, 0, "HIGHER_BETTER")).toBeNull();
    expect(achievementPct(0, 100, "LOWER_BETTER")).toBeNull();
  });

  it("الانحراف قيمةً ونسبةً", () => {
    expect(deviationValue(80, 100)).toBe(-20);
    expect(deviationPct(80)).toBe(20);
    expect(deviationPct(null)).toBeNull();
  });

  it("عتبات الحالة الخمسية", () => {
    expect(kpiStatus(null)).toBe("NO_DATA");
    expect(kpiStatus(100)).toBe("ACHIEVED");
    expect(kpiStatus(80)).toBe("ON_TRACK");
    expect(kpiStatus(60)).toBe("AT_RISK");
    expect(kpiStatus(59.9)).toBe("CRITICAL");
  });

  it("فترات كل تواتر", () => {
    expect(resolvePeriods("QUARTERLY")).toEqual(["Q1", "Q2", "Q3", "Q4"]);
    expect(resolvePeriods("SEMI_ANNUAL")).toEqual(["H1", "H2"]);
    expect(resolvePeriods("ANNUAL")).toEqual(["Y"]);
  });

  it("تواترات فترة جولة القياس", () => {
    expect(frequenciesForPeriod("Q3")).toEqual(["QUARTERLY"]);
    expect(frequenciesForPeriod("H1")).toEqual(["SEMI_ANNUAL"]);
    expect(frequenciesForPeriod("Y")).toEqual(["ANNUAL"]);
  });
});
