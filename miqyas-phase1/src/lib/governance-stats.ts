import { CHART_COLORS } from "@/lib/chart-colors";

export type GovernanceStats = {
  totalRequirements: number;
  compliantCount: number;
  partialCount: number;
  notCompliantCount: number;
  pendingCount: number;
  compliancePct: number;
  openObservations: number;
  closedInPeriod: number;
};

export function complianceDonutSegments(stats: GovernanceStats) {
  if (stats.totalRequirements === 0) return [];
  return [
    {
      name: "مستوفى بالكامل",
      value: stats.compliantCount,
      color: CHART_COLORS.success,
    },
    {
      name: "جزئي",
      value: stats.partialCount,
      color: CHART_COLORS.warning,
    },
    {
      name: "غير مستوفى",
      value: stats.notCompliantCount,
      color: CHART_COLORS.danger,
    },
    {
      name: "انتظار",
      value: stats.pendingCount,
      color: CHART_COLORS.brandGray,
    },
  ].filter((s) => s.value > 0);
}

export function complianceCompareBars(stats: GovernanceStats) {
  return [
    { name: "مستوفى بالكامل", value: stats.compliantCount, color: CHART_COLORS.success },
    { name: "جزئي", value: stats.partialCount, color: CHART_COLORS.warning },
    { name: "غير مستوفى", value: stats.notCompliantCount, color: CHART_COLORS.danger },
  ];
}

export const GOVERNANCE_STAT_LABELS = {
  totalRequirements: "إجمالي المعايير",
  compliantCount: "مستوفى بالكامل",
  partialCount: "جزئي",
  compliancePct: "درجة الجاهزية",
  notCompliantCount: "غير مستوفى",
  openObservations: "الملاحظات القائمة",
  closedInPeriod: "ملاحظات مغلقة خلال الفترة",
} as const;

export const GOVERNANCE_STATUS_LABEL: Record<string, string> = {
  COMPLIANT: "ملتزم",
  PARTIAL: "جزئي",
  NON_COMPLIANT: "غير ملتزم",
  PENDING: "انتظار",
};
