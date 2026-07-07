import type { KpiAnalyticsRow } from "@/lib/analytics";
import { AXIS_LABEL, AXIS_ORDER, axisOf, type StrategicAxis } from "@/lib/axis";
import {
  averageAchievementPct,
  classifyStatus5,
  countStatus5,
  status5FromAveragePct,
  type Status5,
} from "@/lib/status5";

export type StrategicKpiRow = KpiAnalyticsRow & {
  status5: Status5;
  axis: StrategicAxis | null;
};

/** Big O: O(n) time, O(n) space */
export function enrichStrategicRows(rows: KpiAnalyticsRow[]): StrategicKpiRow[] {
  return rows.map((r) => ({
    ...r,
    status5: classifyStatus5(r.actual, r.achievementPct),
    axis: axisOf(r.strategicGoalCode),
  }));
}

export type AxisPerformance = {
  axis: StrategicAxis;
  label: string;
  kpiCount: number;
  goalCount: number;
  avgPct: number | null;
  status5: Status5;
  rows: StrategicKpiRow[];
};

/** Big O: O(n) time, O(n) space */
export function groupByAxis(rows: StrategicKpiRow[]): AxisPerformance[] {
  const map = new Map<StrategicAxis, StrategicKpiRow[]>();
  for (const axis of AXIS_ORDER) map.set(axis, []);
  for (const r of rows) {
    if (r.axis) map.get(r.axis)!.push(r);
  }
  return AXIS_ORDER.map((axis) => {
    const axisRows = map.get(axis)!;
    const goals = new Set(axisRows.map((r) => r.strategicGoalCode).filter(Boolean));
    const avgPct = averageAchievementPct(axisRows);
    return {
      axis,
      label: AXIS_LABEL[axis],
      kpiCount: axisRows.length,
      goalCount: goals.size,
      avgPct,
      status5: status5FromAveragePct(avgPct),
      rows: axisRows,
    };
  });
}

export function strategicSummary(rows: StrategicKpiRow[]) {
  const status5Counts = countStatus5(rows);
  const overallPct = averageAchievementPct(rows);
  const distinctGoals = new Set(rows.map((r) => r.strategicGoalCode).filter(Boolean)).size;
  return {
    overallPct,
    overallStatus5: status5FromAveragePct(overallPct),
    goalCount: distinctGoals,
    kpiCount: rows.length,
    status5Counts,
  };
}

export type BarAxisItem = {
  name: string;
  value: number;
  status5: Status5;
  isOverall?: boolean;
};

/** Big O: O(n) time, O(1) space */
export function axisBarData(
  axes: AxisPerformance[],
  overallPct: number | null,
): BarAxisItem[] {
  const items: BarAxisItem[] = axes.map((a) => ({
    name: a.label,
    value: a.avgPct ?? 0,
    status5: a.status5,
  }));
  items.push({
    name: "أداء الجمعية",
    value: overallPct ?? 0,
    status5: status5FromAveragePct(overallPct),
    isOverall: true,
  });
  return items;
}
