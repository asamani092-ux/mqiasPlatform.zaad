import { CHART_COLORS } from "@/lib/chart-colors";

export type GovernanceStats = {
  totalRequirements: number;
  appliedCount: number;
  compliancePct: number;
  notAppliedCount: number;
  openObservations: number;
  closedInPeriod: number;
};

export function complianceDonutSegments(stats: GovernanceStats) {
  if (stats.totalRequirements === 0) return [];
  return [
    {
      name: "مطبّق",
      value: stats.appliedCount,
      color: CHART_COLORS.success,
    },
    {
      name: "غير مطبّق",
      value: stats.notAppliedCount,
      color: CHART_COLORS.danger,
    },
  ].filter((s) => s.value > 0);
}

export function complianceCompareBars(stats: GovernanceStats) {
  return [
    { name: "مطبّق", value: stats.appliedCount, color: CHART_COLORS.success },
    { name: "غير مطبّق", value: stats.notAppliedCount, color: CHART_COLORS.danger },
  ];
}

export const GOVERNANCE_STAT_LABELS = {
  totalRequirements: "متطلبات الامتثال المعتمدة",
  appliedCount: "المتطلبات المطبّقة",
  compliancePct: "نسبة الامتثال",
  notAppliedCount: "المتطلبات غير المكتملة",
  openObservations: "الملاحظات القائمة",
  closedInPeriod: "ملاحظات مغلقة خلال الفترة",
} as const;
