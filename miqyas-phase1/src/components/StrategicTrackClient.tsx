"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import BarChartWithTarget from "@/components/charts/BarChartWithTarget";
import KpiAnalysisModal from "@/components/KpiAnalysisModal";
import { Status5Badge } from "@/components/Status5Badge";
import { TrackTitleRow } from "@/components/ui/TrackHelpButton";
import {
  axisBarData,
  groupByAxis,
  strategicSummary,
  type StrategicKpiRow,
} from "@/lib/strategic-analytics";
import { AXIS_LABEL, AXIS_ORDER, type StrategicAxis } from "@/lib/axis";
import {
  STATUS5_FILTER_OPTIONS,
  STATUS5_SHORT,
  STATUS5_STAT_ACCENT,
  type Status5,
} from "@/lib/status5";
import { STRATEGIC_HELP } from "@/lib/track-help";
import { type Period } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";

function formatDeviation(pct: number | null | undefined): string {
  if (pct == null) return "—";
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

function KpiMeasurementFields({ row }: { row: StrategicKpiRow }) {
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
            {row.ownerLabel || row.departmentName || "—"}
          </div>
        </div>
      </div>
    </>
  );
}

export default function StrategicTrackClient({
  rows,
  year,
  period,
}: {
  rows: StrategicKpiRow[];
  year: number;
  period: Period;
}) {
  const [filter, setFilter] = useState<Status5 | "all">("all");
  const [analysisRow, setAnalysisRow] = useState<StrategicKpiRow | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [axisFilter, setAxisFilter] = useState<StrategicAxis | "">("");

  const summary = useMemo(() => strategicSummary(rows), [rows]);
  const axes = useMemo(() => groupByAxis(rows), [rows]);
  const barItems = useMemo(
    () => axisBarData(axes, summary.overallPct),
    [axes, summary.overallPct],
  );

  const filteredRows = useMemo(
    () => rows.filter((r) => filter === "all" || r.status5 === filter),
    [rows, filter],
  );

  const tableRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return filteredRows.filter((r) => {
      if (axisFilter && r.axis !== axisFilter) return false;
      if (!q) return true;
      const hay = `${r.code} ${r.name} ${r.ownerLabel ?? ""} ${r.departmentName ?? ""} ${r.strategicGoalCode ?? ""} ${r.strategicGoalTitle ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filteredRows, tableSearch, axisFilter]);

  const filteredAxes = useMemo(() => {
    return axes
      .map((a) => ({
        ...a,
        goalGroups: a.goalGroups
          .map((g) => ({
            ...g,
            rows: g.rows.filter((r) => filter === "all" || r.status5 === filter),
          }))
          .filter((g) => g.rows.length > 0),
      }))
      .filter((a) => a.goalGroups.length > 0);
  }, [axes, filter]);

  const summaryCards = [
    {
      num: summary.overallPct != null ? `${summary.overallPct}%` : "—",
      lbl: "نسبة الأداء الكلي",
      accent: STATUS5_STAT_ACCENT[summary.overallStatus5],
    },
    { num: summary.goalCount, lbl: "الأهداف", accent: "" },
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
      <TrackTitleRow
        title="مسار الأداء الاستراتيجي"
        subtitle="مؤشرات الأداء الاستراتيجي — قيم معتمدة فقط"
        help={STRATEGIC_HELP}
        extra={<PeriodSelector year={year} period={period} />}
      />

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
        <h3 style={{ marginBottom: ".75rem" }}>مقارنة أداء المحاور الاستراتيجية</h3>
        <BarChartWithTarget items={barItems} targetValue={100} keepZeros />
      </div>

      {filteredAxes.length === 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <p className="text-muted">لا توجد مؤشرات مطابقة للفلتر في نطاق صلاحياتك.</p>
        </div>
      )}

      {filteredAxes.map((axis) => (
        <div key={axis.axis} className="axis-block">
          <div className="axis-header card">
            <div>
              <h3>{axis.label}</h3>
              <div className="text-muted">
                {axis.kpiCount} مؤشر · {axis.goalCount} هدف
              </div>
            </div>
            <div style={{ textAlign: "end" }}>
              <div className="stat-num" style={{ fontSize: "1.5rem" }}>
                {axis.avgPct != null ? `${axis.avgPct}%` : "—"}
              </div>
              <Status5Badge status={axis.status5} />
            </div>
          </div>

          {axis.goalGroups.map((goal) => (
            <div key={goal.goalCode ?? goal.goalTitle} className="goal-block">
              <div className="goal-header">
                <span>
                  {goal.goalCode ? `${goal.goalCode} — ` : ""}
                  {goal.goalTitle}
                </span>
              </div>
              <div className="kpi-grid">
                {goal.rows.map((r) => (
                  <div key={r.kpiId} className="card kpi-card">
                    <div className="kpi-row">
                      <span className="kpi-code">{r.code}</span>
                      <Status5Badge status={r.status5} />
                    </div>
                    <div className="kpi-name">{r.name}</div>
                    <KpiMeasurementFields row={r} />
                    <div className="kpi-footer">
                      <span className="text-muted">{r.ownerLabel || r.departmentName || "—"}</span>
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
        <h3 style={{ marginBottom: ".75rem" }}>جميع المؤشرات الاستراتيجية</h3>
        <div
          style={{
            display: "flex",
            gap: ".65rem",
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: ".75rem",
          }}
        >
          <input
            className="input-field"
            style={{ width: "min(260px, 100%)" }}
            placeholder="بحث بالرمز أو الاسم..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
          <select
            className="input-field"
            style={{ width: "auto" }}
            value={axisFilter}
            onChange={(e) => setAxisFilter(e.target.value as StrategicAxis | "")}
          >
            <option value="">كل المحاور</option>
            {AXIS_ORDER.map((ax) => (
              <option key={ax} value={ax}>
                {AXIS_LABEL[ax]}
              </option>
            ))}
          </select>
        </div>
        {tableRows.length === 0 ? (
          <p className="text-muted">لا توجد مؤشرات للعرض.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tmkeen-table table--stack">
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
                {tableRows.map((r) => (
                  <tr key={r.kpiId}>
                    <td data-label="الرمز">{r.code}</td>
                    <td data-label="المؤشر">{r.name}</td>
                    <td data-label="خط الأساس">{r.baseline ?? "—"}</td>
                    <td data-label="المستهدف السنوي">{r.annualTarget ?? "—"}</td>
                    <td data-label="المستهدف الربعي">{r.target ?? "—"}</td>
                    <td data-label="المتحقق الفعلي">{r.actual ?? "—"}</td>
                    <td data-label="نسبة الإنجاز">{r.achievementPct != null ? `${r.achievementPct}%` : "—"}</td>
                    <td data-label="الانحراف">{formatDeviation(r.deviationPct)}</td>
                    <td data-label="الحالة">
                      <Status5Badge status={r.status5} />
                    </td>
                    <td data-label="تحليل">
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
          onClose={() => setAnalysisRow(null)}
        />
      )}
    </>
  );
}
