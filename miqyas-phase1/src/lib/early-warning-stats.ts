import { CHART_COLORS } from "@/lib/chart-colors";

export type RiskLevelKey = "HIGH" | "MEDIUM" | "LOW";

/** عتبة الإنذار المبكر الحي: إنجاز أقل من 85% */
export const EARLY_WARNING_ACHIEVEMENT_THRESHOLD = 85;

/** صف إنذار مبكر حي — مؤشرات APPROVED تحت عتبة الإنجاز */
export type EarlyWarningRow = {
  kpiId: number;
  code: string;
  name: string;
  target: number;
  actual: number;
  achievementPct: number;
  gapPct: number;
  riskLevel: RiskLevelKey;
  riskLabel: string;
  deviationCardId: number | null;
};

export type EarlyWarningSummary = {
  activeCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  distinctKpiCount: number;
};

export const RISK_LABEL: Record<RiskLevelKey, string> = {
  LOW: "منخفض",
  MEDIUM: "متوسط",
  HIGH: "مرتفع",
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** gap = 100 − achievement — HIGH ≥30، MEDIUM ≥15، وإلا LOW */
export function riskFromGap(gapPct: number): RiskLevelKey {
  if (gapPct >= 30) return "HIGH";
  if (gapPct >= 15) return "MEDIUM";
  return "LOW";
}

export function isBelowEarlyWarningThreshold(
  achievementPct: number | null,
  actual: number | null,
  target: number | null,
): boolean {
  if (actual == null || target == null || target <= 0) return false;
  if (achievementPct != null && achievementPct < EARLY_WARNING_ACHIEVEMENT_THRESHOLD) {
    return true;
  }
  return actual / target < EARLY_WARNING_ACHIEVEMENT_THRESHOLD / 100;
}

export function computeGapPct(achievementPct: number): number {
  return round1(100 - achievementPct);
}

const RISK_ORDER: Record<RiskLevelKey, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export const RISK_BADGE: Record<string, string> = {
  HIGH: "badge-danger",
  MEDIUM: "badge-primary",
  LOW: "badge-success",
};

export const RISK_CHART_COLOR: Record<RiskLevelKey, string> = {
  HIGH: CHART_COLORS.danger,
  MEDIUM: CHART_COLORS.primary,
  LOW: CHART_COLORS.success,
};

/** Big O: O(n) time, O(n) space */
export function summarizeEarlyWarning(rows: EarlyWarningRow[]): EarlyWarningSummary {
  const kpiIds = new Set<number>();
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  for (const r of rows) {
    kpiIds.add(r.kpiId);
    if (r.riskLevel === "HIGH") highCount++;
    else if (r.riskLevel === "MEDIUM") mediumCount++;
    else lowCount++;
  }
  return {
    activeCount: rows.length,
    highCount,
    mediumCount,
    lowCount,
    distinctKpiCount: kpiIds.size,
  };
}

/** Big O: O(n) time, O(1) space */
export function riskDonutSegments(rows: EarlyWarningRow[]) {
  const summary = summarizeEarlyWarning(rows);
  const total = summary.activeCount;
  if (!total) return [];
  return (["HIGH", "MEDIUM", "LOW"] as const)
    .map((level) => ({
      name: RISK_LABEL[level],
      value:
        level === "HIGH"
          ? summary.highCount
          : level === "MEDIUM"
            ? summary.mediumCount
            : summary.lowCount,
      color: RISK_CHART_COLOR[level],
      pct: Math.round(
        ((level === "HIGH"
          ? summary.highCount
          : level === "MEDIUM"
            ? summary.mediumCount
            : summary.lowCount) /
          total) *
          1000,
      ) / 10,
    }))
    .filter((s) => s.value > 0);
}

/** Big O: O(n log n) — أخطر أولاً ثم أكبر فجوة */
export function sortAlertsByRisk(rows: EarlyWarningRow[]): EarlyWarningRow[] {
  return [...rows].sort((a, b) => {
    const dr = (RISK_ORDER[b.riskLevel] ?? 0) - (RISK_ORDER[a.riskLevel] ?? 0);
    if (dr !== 0) return dr;
    return b.gapPct - a.gapPct;
  });
}
