import type { Period } from "@/lib/types";

export function currentQuarter(): { year: number; period: Period } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let period: Period = "Q1";
  if (month <= 3) period = "Q1";
  else if (month <= 6) period = "Q2";
  else if (month <= 9) period = "Q3";
  else period = "Q4";
  return { year, period };
}

export function calcAchievement(actual: number, target: number, lowerBetter = false): number {
  if (target === 0) return 0;
  const pct = lowerBetter ? (target / actual) * 100 : (actual / target) * 100;
  return Math.round(Math.min(pct, 999) * 10) / 10;
}

export function calcStatus(achievementPct: number | null): "ACHIEVED" | "ON_TRACK" | "AT_RISK" | "CRITICAL" | "NO_DATA" {
  if (achievementPct === null || achievementPct === undefined) return "NO_DATA";
  if (achievementPct >= 100) return "ACHIEVED";
  if (achievementPct >= 80) return "ON_TRACK";
  if (achievementPct >= 60) return "AT_RISK";
  return "CRITICAL";
}
