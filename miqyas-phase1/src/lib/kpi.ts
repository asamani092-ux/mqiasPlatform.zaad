import type { Frequency, Period, Polarity } from "@prisma/client";
import type { KpiStatus } from "@/lib/types";

export type { Period } from "@/lib/types";

export function currentQuarter(date = new Date()): { year: number; period: Period } {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let period: Period = "Q1";
  if (month <= 3) period = "Q1";
  else if (month <= 6) period = "Q2";
  else if (month <= 9) period = "Q3";
  else period = "Q4";
  return { year, period };
}

export function resolvePeriods(frequency: Frequency): Period[] {
  switch (frequency) {
    case "QUARTERLY":
      return ["Q1", "Q2", "Q3", "Q4"];
    case "SEMI_ANNUAL":
      return ["H1", "H2"];
    case "ANNUAL":
      return ["Y"];
    default:
      return ["Q1", "Q2", "Q3", "Q4"];
  }
}

export function achievementPct(
  actual: number,
  target: number,
  direction: Polarity,
): number | null {
  if (target === 0) return null;
  if (direction === "LOWER_BETTER") {
    if (actual === 0) return null;
    return round1((target / actual) * 100);
  }
  return round1((actual / target) * 100);
}

export function deviationValue(actual: number, target: number): number {
  return round1(actual - target);
}

export function deviationPct(pct: number | null): number | null {
  if (pct === null) return null;
  return round1(100 - pct);
}

export function kpiStatus(pct: number | null): KpiStatus {
  if (pct === null || pct === undefined) return "NO_DATA";
  if (pct >= 100) return "ACHIEVED";
  if (pct >= 80) return "ON_TRACK";
  if (pct >= 60) return "AT_RISK";
  return "CRITICAL";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// توافق مع الكود القديم
export const calcAchievement = (
  actual: number,
  target: number,
  lowerBetter = false,
) => achievementPct(actual, target, lowerBetter ? "LOWER_BETTER" : "HIGHER_BETTER") ?? 0;

export const calcStatus = kpiStatus;
