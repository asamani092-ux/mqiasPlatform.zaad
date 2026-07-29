import { CHART_COLORS } from "@/lib/chart-colors";

export type GovernanceStats = {
  totalRequirements: number;
  compliantCount: number;
  compliancePct: number;
  notCompliantCount: number;
  openObservations: number;
  closedInPeriod: number;
};

export function complianceDonutSegments(stats: GovernanceStats) {
  if (stats.totalRequirements === 0) return [];
  const partialCount = stats.totalRequirements - stats.compliantCount - stats.notCompliantCount;
  return [
    {
      name: "ممتثل",
      value: stats.compliantCount,
      color: CHART_COLORS.success,
    },
    {
      name: "جزئي",
      value: partialCount,
      color: CHART_COLORS.warning,
    },
    {
      name: "غير ممتثل",
      value: stats.notCompliantCount,
      color: CHART_COLORS.danger,
    },
  ].filter((s) => s.value > 0);
}

export function complianceCompareBars(stats: GovernanceStats) {
  const partialCount = stats.totalRequirements - stats.compliantCount - stats.notCompliantCount;
  return [
    { name: "ممتثل", value: stats.compliantCount, color: CHART_COLORS.success },
    { name: "جزئي", value: partialCount, color: CHART_COLORS.warning },
    { name: "غير ممتثل", value: stats.notCompliantCount, color: CHART_COLORS.danger },
  ];
}

export const GOVERNANCE_STAT_LABELS = {
  totalRequirements: "متطلبات الامتثال المعتمدة",
  compliantCount: "المتطلبات الممتثلة",
  compliancePct: "نسبة الامتثال",
  notCompliantCount: "المتطلبات غير الممتثلة",
  openObservations: "الملاحظات القائمة",
  closedInPeriod: "ملاحظات مغلقة خلال الفترة",
} as const;
