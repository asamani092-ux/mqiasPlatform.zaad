import type { KpiAnalyticsRow } from "@/lib/analytics";

/** صف مشترك لنافذة تحليل KPI (استراتيجي + تشغيلي) */
export type AnalysisKpiRow = Pick<
  KpiAnalyticsRow,
  | "kpiId"
  | "code"
  | "name"
  | "baseline"
  | "annualTarget"
  | "target"
  | "actual"
  | "achievementPct"
  | "deviationPct"
  | "ownerLabel"
  | "departmentName"
  | "strategicGoalCode"
  | "strategicGoalTitle"
>;
