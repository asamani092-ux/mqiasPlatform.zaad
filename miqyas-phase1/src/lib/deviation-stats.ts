import { CHART_COLORS } from "@/lib/chart-colors";

export type DeviationCardRow = {
  id: number;
  status: string;
  actions: { status: string }[];
};

export type DeviationSummary = {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  lateActions: number;
};

export const CARD_STATUS_LABEL: Record<string, string> = {
  OPEN: "مفتوحة",
  IN_PROGRESS: "قيد المعالجة",
  CLOSED: "مغلقة",
};

export const CARD_STATUS_BADGE: Record<string, string> = {
  OPEN: "badge-warning",
  IN_PROGRESS: "badge-primary",
  CLOSED: "badge-success",
};

export const ACTION_STATUS_LABEL: Record<string, string> = {
  PENDING: "معلق",
  IN_PROGRESS: "جاري",
  DONE: "منجز",
  LATE: "متأخر",
};

export const ACTION_STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-secondary",
  IN_PROGRESS: "badge-primary",
  DONE: "badge-success",
  LATE: "badge-danger",
};

/** Big O: O(n) time, O(1) space */
export function summarizeDeviationCards(
  cards: DeviationCardRow[],
  lateActions: number,
): DeviationSummary {
  let open = 0;
  let inProgress = 0;
  let closed = 0;
  for (const c of cards) {
    if (c.status === "OPEN") open++;
    else if (c.status === "IN_PROGRESS") inProgress++;
    else if (c.status === "CLOSED") closed++;
  }
  return { total: cards.length, open, inProgress, closed, lateActions };
}

/** Big O: O(n) time, O(1) space */
export function openActionsCount(actions: { status: string }[]): number {
  return actions.filter((a) => a.status !== "DONE").length;
}

export function cardStatusDonutSegments(summary: DeviationSummary) {
  if (summary.total === 0) return [];
  return [
    { name: CARD_STATUS_LABEL.OPEN, value: summary.open, color: CHART_COLORS.secondary },
    { name: CARD_STATUS_LABEL.IN_PROGRESS, value: summary.inProgress, color: CHART_COLORS.primary },
    { name: CARD_STATUS_LABEL.CLOSED, value: summary.closed, color: CHART_COLORS.success },
  ].filter((s) => s.value > 0);
}
