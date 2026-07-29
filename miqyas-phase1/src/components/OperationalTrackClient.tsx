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

function formatDeviation(pct: number | null | undefined): string {
  if (pct == null) return "—";
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

function KpiMeasurementFields({ row }: { row: OperationalKpiRow }) {
  return (
    <>
      <div className="kpi-fields kpi-fields--core">
        <div className="field field--core">
          <div className="field-lbl">خط الأساس</div>
          <div className="field-val">{row.baseline ?? "—"}</div>
        </div>
        <div className="field field--core">
          <div className="field-lbl">المستهدف السنوي</div>
          <div className="field-val">{row.annualTarget ?? "—"}</div>
        </div>
        <div className="field field--core">
          <div className="field-lbl">المستهدف الربعي</div>
          <div className="field-val">{row.target ?? "—"}</div>
        </div>
        <div className="field field--core">
          <div className="field-lbl">المتحقق الفعلي</div>
          <div className="field-val">{row.actual ?? "—"}</div>
        </div>
        <div className="field field--core">
          <div className="field-lbl">نسبة الإنجاز</div>
          <div className="field-val">
            {row.achievementPct != null ? `${row.achievementPct}%` : "—"}
          </div>
        </div>
      </div>
      <div className="kpi-fields kpi-fields--meta">
        <div className="field">
          <div className="field-lbl">الانحراف</div>
          <div className="field-val">{formatDeviation(row.deviationPct)}</div>
        </div>
        <div className="field">
          <div className="field-lbl">الحالة</div>
          <div className="field-val" style={{ fontSize: ".68rem" }}>
            <Status5Badge status={row.status5} />
          </div>
        </div>
        <div className="field">
          <div className="field-lbl">المالك</div>
          <div className="field-val" style={{ fontSize: ".72rem" }}>
            {row.ownerLabel || row.sectionName || row.departmentName || "—"}
          </div>
        </div>
      </div>
    </>
  );
}

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

  const filteredRows = useMemo(
    () => rows.filter((r) => filter === "all" || r.status5 === filter),
    [rows, filter],
  );

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
    {
      num: summary.status5Counts.pending,
      lbl: STATUS5_SHORT.pending,
      accent: STATUS5_STAT_ACCENT.pending,
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
        {STATUS5_FILTER_OPTIONS.map((opt) => (
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
        <BarChartWithTarget items={barItems} targetValue={100} keepZeros />
      </div>

      {filteredDepts.length === 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
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
                <span>{goal.goalTitle}</span>
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
                    <KpiMeasurementFields row={r} />
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

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>جميع المؤشرات التشغيلية</h3>
        {filteredRows.length === 0 ? (
          <p className="text-muted">لا توجد مؤشرات للعرض.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tmkeen-table">
              <thead>
                <tr>
                  <th>الرمز</th>
                  <th>المؤشر</th>
                  <th>خط الأساس</th>
                  <th>المستهدف السنوي</th>
                  <th>المستهدف الربعي</th>
                  <th>المتحقق الفعلي</th>
                  <th>نسبة الإنجاز</th>
                  <th>الانحراف</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.kpiId}>
                    <td>{r.code}</td>
                    <td>{r.name}</td>
                    <td>{r.baseline ?? "—"}</td>
                    <td>{r.annualTarget ?? "—"}</td>
                    <td>{r.target ?? "—"}</td>
                    <td>{r.actual ?? "—"}</td>
                    <td>{r.achievementPct != null ? `${r.achievementPct}%` : "—"}</td>
                    <td>{formatDeviation(r.deviationPct)}</td>
                    <td>
                      <Status5Badge status={r.status5} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => setAnalysisRow(r)}
                      >
                        <BarChart3 {...ICON_PROPS} />
                        تحليل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
