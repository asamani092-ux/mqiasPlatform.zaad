import { describe, expect, it } from "vitest";
import { isEarlyWarningWindow, timeProgressInQuarter } from "@/lib/cron-jobs";

describe("early-warning window", () => {
  it("يُفعّل في الشهر الثالث من كل ربع فقط", () => {
    expect(isEarlyWarningWindow(new Date(2026, 2, 5))).toBe(true); // مارس
    expect(isEarlyWarningWindow(new Date(2026, 5, 20))).toBe(true); // يونيو
    expect(isEarlyWarningWindow(new Date(2026, 8, 1))).toBe(true); // سبتمبر
    expect(isEarlyWarningWindow(new Date(2026, 11, 31))).toBe(true); // ديسمبر
    expect(isEarlyWarningWindow(new Date(2026, 0, 15))).toBe(false); // يناير
    expect(isEarlyWarningWindow(new Date(2026, 6, 15))).toBe(false); // يوليو
  });

  it("التقدم الزمني بين 0 و1 داخل الربع", () => {
    expect(timeProgressInQuarter(new Date(2026, 0, 1), 2026, "Q1")).toBe(0);
    expect(timeProgressInQuarter(new Date(2025, 11, 1), 2026, "Q1")).toBe(0);
    expect(timeProgressInQuarter(new Date(2026, 3, 15), 2026, "Q1")).toBe(1);
    const mid = timeProgressInQuarter(new Date(2026, 1, 14), 2026, "Q1");
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.6);
  });
});
