import { CHART_COLORS } from "@/lib/chart-colors";

export type Status5 =
  | "exceeded"
  | "achieved"
  | "partial"
  | "not_achieved"
  | "pending";

export const STATUS5_LABEL: Record<Status5, string> = {
  exceeded: "متجاوز",
  achieved: "متحقق",
  partial: "متحقق جزئياً",
  not_achieved: "غير متحقق",
  pending: "في الانتظار",
};

export const STATUS5_SHORT: Record<Status5, string> = {
  exceeded: "متجاوز",
  achieved: "متحقق",
  partial: "جزئي",
  not_achieved: "غير متحقق",
  pending: "في الانتظار",
};

export const STATUS5_COLOR: Record<Status5, string> = {
  exceeded: CHART_COLORS.success,
  achieved: CHART_COLORS.primary,
  partial: CHART_COLORS.secondary,
  not_achieved: CHART_COLORS.danger,
  pending: CHART_COLORS.brandGray,
};

export const STATUS5_BADGE: Record<Status5, string> = {
  exceeded: "badge-success",
  achieved: "badge-primary",
  partial: "badge-warning",
  not_achieved: "badge-danger",
  pending: "badge-secondary",
};

export const STATUS5_STAT_ACCENT: Record<Status5, string> = {
  exceeded: "stat-card--success",
  achieved: "",
  partial: "stat-card--secondary",
  not_achieved: "stat-card--danger",
  pending: "stat-card--warning",
};

/** Big O: O(1) time, O(1) space */
export function ratioFromAchievementPct(pct: number): number {
  return pct / 100;
}

/** Big O: O(1) time, O(1) space — approved entries only (actual present) */
export function classifyStatus5(
  actual: number | null | undefined,
  achievementPct: number | null | undefined,
): Status5 {
  if (actual == null) return "pending";
  if (achievementPct == null) return "pending";
  const ratio = ratioFromAchievementPct(achievementPct);
  if (ratio >= 1.0) return "exceeded";
  if (ratio >= 0.85) return "achieved";
  if (ratio >= 0.5) return "partial";
  return "not_achieved";
}

export function status5FromPct(pct: number | null, hasApprovedActual: boolean): Status5 {
  if (!hasApprovedActual || pct == null) return "pending";
  return classifyStatus5(1, pct);
}

export function emptyStatus5Counts(): Record<Status5, number> {
  return {
    exceeded: 0,
    achieved: 0,
    partial: 0,
    not_achieved: 0,
    pending: 0,
  };
}

/** Big O: O(n) time, O(1) space */
export function countStatus5<T extends { status5: Status5 }>(rows: T[]): Record<Status5, number> {
  const counts = emptyStatus5Counts();
  for (const r of rows) counts[r.status5]++;
  return counts;
}

/** Big O: O(n) time, O(1) space */
export function averageAchievementPct(
  rows: { achievementPct: number | null }[],
): number | null {
  const vals = rows
    .map((r) => r.achievementPct)
    .filter((v): v is number => v != null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
}

/** Big O: O(n) time, O(1) space — worst status for aggregate bar color */
export function dominantStatus5(counts: Record<Status5, number>): Status5 {
  const order: Status5[] = ["not_achieved", "pending", "partial", "achieved", "exceeded"];
  let best: Status5 = "pending";
  let bestCount = -1;
  for (const s of order) {
    if (counts[s] > bestCount) {
      bestCount = counts[s];
      best = s;
    }
  }
  const measured = counts.exceeded + counts.achieved + counts.partial + counts.not_achieved;
  if (measured === 0) return "pending";
  if (counts.not_achieved > 0) return "not_achieved";
  if (counts.partial > 0) return "partial";
  if (counts.achieved > 0 && counts.exceeded === 0) return "achieved";
  if (counts.exceeded > 0) return "exceeded";
  return best;
}

/** Big O: O(n) time, O(1) space — status from average pct */
export function status5FromAveragePct(pct: number | null): Status5 {
  if (pct == null) return "pending";
  return classifyStatus5(1, pct);
}

export const STATUS5_FILTER_OPTIONS: { key: Status5 | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "exceeded", label: "متجاوز" },
  { key: "achieved", label: "متحقق" },
  { key: "partial", label: "جزئي" },
  { key: "not_achieved", label: "غير متحقق" },
];
