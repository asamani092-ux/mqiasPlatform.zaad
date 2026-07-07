import { CHART_COLORS } from "@/lib/chart-colors";

export type EarlyWarningRow = {
  id: number;
  kpiId: number;
  kpiCode: string;
  kpiName: string;
  actualToDate: number;
  expectedToDate: number;
  gapPct: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  riskLabel: string;
  recipients: string;
  emailSent: boolean;
  createdAt: string;
};

export type EarlyWarningSummary = {
  activeCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  distinctKpiCount: number;
  gapThresholdPct: string;
};

const RISK_LABEL: Record<string, string> = {
  LOW: "منخفض",
  MEDIUM: "متوسط",
  HIGH: "مرتفع",
};

const RISK_ORDER: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export const RISK_BADGE: Record<string, string> = {
  HIGH: "badge-danger",
  MEDIUM: "badge-primary",
  LOW: "badge-success",
};

export const RISK_CHART_COLOR: Record<string, string> = {
  HIGH: CHART_COLORS.danger,
  MEDIUM: CHART_COLORS.primary,
  LOW: CHART_COLORS.success,
};

/** Big O: O(n) time, O(n) space */
export function summarizeEarlyWarning(rows: EarlyWarningRow[]): Omit<EarlyWarningSummary, "gapThresholdPct"> {
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

/** Big O: O(n log n) time, O(n) space */
export function sortAlertsByRisk(rows: EarlyWarningRow[]): EarlyWarningRow[] {
  return [...rows].sort((a, b) => {
    const dr = (RISK_ORDER[b.riskLevel] ?? 0) - (RISK_ORDER[a.riskLevel] ?? 0);
    if (dr !== 0) return dr;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export { RISK_LABEL };
