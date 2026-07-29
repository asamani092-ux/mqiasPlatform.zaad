import { CHART_COLORS } from "@/lib/chart-colors";

export type KnowledgeStats = {
  total: number;
  approvedPct: number;
  usedPct: number;
  linkedToKpiCount: number;
  approvedCount: number;
  draftCount: number;
};

export function knowledgeApprovedDonut(stats: KnowledgeStats) {
  if (stats.total === 0) return [];
  return [
    {
      name: "نشط",
      value: stats.approvedCount,
      color: CHART_COLORS.success,
    },
    {
      name: "أخرى",
      value: stats.draftCount,
      color: CHART_COLORS.secondary,
    },
  ].filter((s) => s.value > 0);
}

export const KNOWLEDGE_STAT_LABELS = {
  total: "عدد الأصول خلال الفترة",
  approvedPct: "نسبة الأصول النشطة",
  usedPct: "نسبة الأصول المستخدمة",
  linkedToKpiCount: "مرتبطة بمؤشرات أداء",
} as const;

export const ASSET_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "نشط",
  DRAFT: "مسودة",
  UNDER_REVIEW: "قيد المراجعة",
  ARCHIVED: "مؤرشف",
};

export const ASSET_STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge-success",
  DRAFT: "badge-warning",
  UNDER_REVIEW: "badge-secondary",
  ARCHIVED: "badge-neutral",
};

export const ASSET_STATUSES = ["ACTIVE", "DRAFT", "UNDER_REVIEW", "ARCHIVED"] as const;
export type AssetStatusValue = (typeof ASSET_STATUSES)[number];
