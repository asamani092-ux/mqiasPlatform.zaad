import { CHART_COLORS } from "@/lib/chart-colors";

export type KnowledgeStats = {
  total: number;
  approvedPct: number;
  usedPct: number;
  growthPct: number;
  approvedCount: number;
  draftCount: number;
};

export function knowledgeApprovedDonut(stats: KnowledgeStats) {
  if (stats.total === 0) return [];
  return [
    {
      name: "معتمد",
      value: stats.approvedCount,
      color: CHART_COLORS.success,
    },
    {
      name: "مسودة",
      value: stats.draftCount,
      color: CHART_COLORS.secondary,
    },
  ].filter((s) => s.value > 0);
}

export const KNOWLEDGE_STAT_LABELS = {
  total: "عدد الأصول خلال الفترة",
  approvedPct: "نسبة الأصول المعتمدة",
  usedPct: "نسبة الأصول المستخدمة",
  growthPct: "معدل نمو المعرفة",
} as const;
