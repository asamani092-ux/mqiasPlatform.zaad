"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import BarChartWithTarget from "@/components/charts/BarChartWithTarget";
import KpiAnalysisModal from "@/components/KpiAnalysisModal";
import { Status5Badge } from "@/components/Status5Badge";
import {
  departmentBarData,
  groupByDepartment,
  operationalSummary,
  type DepartmentRef,
  type OperationalKpiRow,
} from "@/lib/operational-analytics";
import {
  STATUS5_FILTER_OPTIONS,
  STATUS5_SHORT,
  STATUS5_STAT_ACCENT,
  type Status5,
} from "@/lib/status5";
import { type Period } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";

export default function OperationalTrackClient({
  rows,
  departments,
  year,
  period,
}: {
  rows: OperationalKpiRow[];
  departments: DepartmentRef[];
  year: number;
  period: Period;
}) {
  const [filter, setFilter] = useState<Status5 | "all">("all");
  const [analysisRow, setAnalysisRow] = useState<OperationalKpiRow | null>(null);

  const summary = useMemo(() => operationalSummary(rows), [rows]);
  const deptGroups = useMemo(() => groupByDepartment(rows, departments), [rows, departments]);
  const barItems = useMemo(() => departmentBarData(deptGroups), [deptGroups]);

  const filteredDepts = useMemo(
    () =>
      deptGroups
        .map((d) => ({
          ...d,
          goalGroups: d.goalGroups
            .map((g) => ({
              ...g,
              rows: g.rows.filter((r) => filter === "all" || r.status5 === filter),
            }))
            .filter((g) => g.rows.length > 0),
        }))
        .filter((d) => d.goalGroups.length > 0),
    [deptGroups, filter],
  );

  const summaryCards = [
    {
      num: summary.overallPct != null ? `${summary.overallPct}%` : "—",
      lbl: "نسبة الأداء الكلي",
      accent: STATUS5_STAT_ACCENT[summary.overallStatus5],
    },
    { num: summary.departmentCount, lbl: "عدد الإدارات", accent: "" },
    { num: summary.goalCount, lbl: "الأهداف التشغيلية", accent: "stat-card--secondary" },
    { num: summary.kpiCount, lbl: "المؤشرات", accent: "" },
    {
      num: summary.status5Counts.exceeded,
      lbl: STATUS5_SHORT.exceeded,
      accent: STATUS5_STAT_ACCENT.exceeded,
    },
    {
      num: summary.status5Counts.achieved,
      lbl: STATUS5_SHORT.achieved,
      accent: STATUS5_STAT_ACCENT.achieved,
    },
    {
      num: summary.status5Counts.partial,
      lbl: STATUS5_SHORT.partial,
      accent: STATUS5_STAT_ACCENT.partial,
    },
    {
      num: summary.status5Counts.not_achieved,
      lbl: STATUS5_SHORT.not_achieved,
      accent: STATUS5_STAT_ACCENT.not_achieved,
    },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار الأداء التشغيلي</h1>
          <div className="text-muted">مؤشرات الأداء التشغيلي — قيم معتمدة فقط</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      <div className="tab-bar" style={{ marginBottom: "1rem" }}>
        {STATUS5_FILTER_OPTIONS.filter((o) => o.key !== "pending").map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={filter === opt.key ? "active" : ""}
            onClick={() => setFilter(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
        {summaryCards.map((s) => (
          <div key={s.lbl} className={`card stat-card ${s.accent}`.trim()}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>مقارنة أداء الإدارات</h3>
        <BarChartWithTarget items={barItems} targetValue={100} />
      </div>

      {filteredDepts.length === 0 && (
        <div className="card">
          <p className="text-muted">لا توجد مؤشرات مطابقة للفلتر في نطاق صلاحياتك.</p>
        </div>
      )}

      {filteredDepts.map((dept) => (
        <div key={dept.departmentId} className="axis-block">
          <div className="axis-header card">
            <div>
              <h3>{dept.name}</h3>
              <div className="text-muted">
                {dept.kpiCount} مؤشر · {dept.goalCount} هدف تشغيلي
              </div>
            </div>
            <div style={{ textAlign: "end" }}>
              <div className="stat-num" style={{ fontSize: "1.5rem" }}>
                {dept.avgPct != null ? `${dept.avgPct}%` : "—"}
              </div>
              <Status5Badge status={dept.status5} />
            </div>
          </div>

          {dept.goalGroups.map((goal) => (
            <div key={goal.goalTitle} className="goal-block">
              <div className="goal-header">
                <span className="text-muted">{goal.goalTitle}</span>
              </div>
              <div className="kpi-grid">
                {goal.rows.map((r) => (
                  <div key={r.kpiId} className="card kpi-card">
                    <div className="kpi-row">
                      <span className="kpi-code">{r.code}</span>
                      <Status5Badge status={r.status5} />
                    </div>
                    <div className="kpi-name">{r.name}</div>
                    {r.strategicGoalCode && (
                      <div className="text-muted" style={{ fontSize: ".72rem", marginBottom: ".5rem" }}>
                        الارتباط الاستراتيجي: {r.strategicGoalCode}
                      </div>
                    )}
                    <div className="kpi-fields">
                      <div className="field">
                        <div className="field-lbl">المستهدف</div>
                        <div className="field-val">{r.target ?? "—"}</div>
                      </div>
                      <div className="field">
                        <div className="field-lbl">المتحقق</div>
                        <div className="field-val">{r.actual ?? "—"}</div>
                      </div>
                      <div className="field">
                        <div className="field-lbl">الإنجاز</div>
                        <div className="field-val">
                          {r.achievementPct != null ? `${r.achievementPct}%` : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="kpi-footer">
                      <span className="text-muted">{r.sectionName || r.ownerLabel || "—"}</span>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => setAnalysisRow(r)}
                      >
                        <BarChart3 {...ICON_PROPS} />
                        تحليل
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {analysisRow && (
        <KpiAnalysisModal
          row={analysisRow}
          year={year}
          period={period}
          showStrategicLink
          onClose={() => setAnalysisRow(null)}
        />
      )}
    </>
  );
}
