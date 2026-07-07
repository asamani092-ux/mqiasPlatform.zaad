"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import BarChartWithTarget from "@/components/charts/BarChartWithTarget";
import KpiAnalysisModal from "@/components/KpiAnalysisModal";
import { Status5Badge } from "@/components/Status5Badge";
import {
  axisBarData,
  groupByAxis,
  strategicSummary,
  type StrategicKpiRow,
} from "@/lib/strategic-analytics";
import {
  STATUS5_FILTER_OPTIONS,
  STATUS5_SHORT,
  STATUS5_STAT_ACCENT,
  type Status5,
} from "@/lib/status5";
import { type Period } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";

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

  const summary = useMemo(() => strategicSummary(rows), [rows]);
  const axes = useMemo(() => groupByAxis(rows), [rows]);
  const barItems = useMemo(
    () => axisBarData(axes, summary.overallPct),
    [axes, summary.overallPct],
  );

  const filteredAxes = useMemo(() => {
    return axes
      .map((a) => ({
        ...a,
        rows: a.rows.filter((r) => filter === "all" || r.status5 === filter),
      }))
      .filter((a) => a.rows.length > 0);
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
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار الأداء الاستراتيجي</h1>
          <div className="text-muted">مؤشرات الأداء الاستراتيجي — قيم معتمدة فقط</div>
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
        <h3 style={{ marginBottom: ".75rem" }}>مقارنة أداء المحاور الاستراتيجية</h3>
        <BarChartWithTarget items={barItems} targetValue={100} />
      </div>

      {filteredAxes.length === 0 && (
        <div className="card">
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

          <div className="kpi-grid">
            {axis.rows.map((r) => (
              <div key={r.kpiId} className="card kpi-card">
                <div className="kpi-row">
                  <span className="kpi-code">{r.code}</span>
                  <Status5Badge status={r.status5} />
                </div>
                <div className="kpi-name">{r.name}</div>
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
                  <span className="text-muted">{r.strategicGoalTitle || "—"}</span>
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
