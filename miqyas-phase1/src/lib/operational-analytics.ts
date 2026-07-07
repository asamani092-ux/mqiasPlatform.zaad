import type { KpiAnalyticsRow } from "@/lib/analytics";
import {
  averageAchievementPct,
  classifyStatus5,
  countStatus5,
  status5FromAveragePct,
  type Status5,
} from "@/lib/status5";

export type OperationalKpiRow = KpiAnalyticsRow & {
  status5: Status5;
  departmentId: number | null;
};

export type DepartmentRef = {
  id: number;
  name: string;
  deptNo: number;
};

/** Big O: O(n) time, O(n) space */
export function enrichOperationalRows(rows: KpiAnalyticsRow[]): OperationalKpiRow[] {
  return rows.map((r) => ({
    ...r,
    departmentId: r.departmentId ?? null,
    status5: classifyStatus5(r.actual, r.achievementPct),
  }));
}

export type OperationalGoalGroup = {
  goalTitle: string;
  rows: OperationalKpiRow[];
};

export type DepartmentPerformance = {
  departmentId: number;
  name: string;
  kpiCount: number;
  goalCount: number;
  avgPct: number | null;
  status5: Status5;
  rows: OperationalKpiRow[];
  goalGroups: OperationalGoalGroup[];
};

/** Big O: O(n + d) time, O(n) space */
export function groupByDepartment(
  rows: OperationalKpiRow[],
  departments: DepartmentRef[],
): DepartmentPerformance[] {
  const byDept = new Map<number, OperationalKpiRow[]>();
  for (const d of departments) byDept.set(d.id, []);
  for (const r of rows) {
    if (r.departmentId != null && byDept.has(r.departmentId)) {
      byDept.get(r.departmentId)!.push(r);
    }
  }

  return departments
    .map((dept) => {
      const deptRows = byDept.get(dept.id) ?? [];
      const goals = new Set(deptRows.map((r) => r.operationalGoalTitle).filter(Boolean));
      const avgPct = averageAchievementPct(deptRows);

      const goalMap = new Map<string, OperationalKpiRow[]>();
      for (const r of deptRows) {
        const key = r.operationalGoalTitle || "بدون هدف تشغيلي";
        if (!goalMap.has(key)) goalMap.set(key, []);
        goalMap.get(key)!.push(r);
      }
      const goalGroups: OperationalGoalGroup[] = Array.from(goalMap.entries()).map(
        ([goalTitle, goalRows]) => ({ goalTitle, rows: goalRows }),
      );

      return {
        departmentId: dept.id,
        name: dept.name,
        kpiCount: deptRows.length,
        goalCount: goals.size,
        avgPct,
        status5: status5FromAveragePct(avgPct),
        rows: deptRows,
        goalGroups,
      };
    })
    .filter((d) => d.kpiCount > 0);
}

export function operationalSummary(rows: OperationalKpiRow[]) {
  const status5Counts = countStatus5(rows);
  const overallPct = averageAchievementPct(rows);
  const departmentIds = new Set(rows.map((r) => r.departmentId).filter(Boolean));
  const goalTitles = new Set(rows.map((r) => r.operationalGoalTitle).filter(Boolean));
  return {
    overallPct,
    overallStatus5: status5FromAveragePct(overallPct),
    departmentCount: departmentIds.size,
    goalCount: goalTitles.size,
    kpiCount: rows.length,
    status5Counts,
  };
}

export type DepartmentBarItem = {
  name: string;
  value: number;
  status5: Status5;
};

/** Big O: O(d) time, O(d) space */
export function departmentBarData(depts: DepartmentPerformance[]): DepartmentBarItem[] {
  return depts.map((d) => ({
    name: d.name,
    value: d.avgPct ?? 0,
    status5: d.status5,
  }));
}
