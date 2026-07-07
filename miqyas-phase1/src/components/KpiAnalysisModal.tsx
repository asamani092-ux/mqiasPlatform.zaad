"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, Download, X } from "lucide-react";
import LineTrend, { type TrendPoint } from "@/components/charts/LineTrend";
import { Status5OwnerLine } from "@/components/Status5Badge";
import { classifyStatus5 } from "@/lib/status5";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";
import type { AnalysisKpiRow } from "@/lib/analysis-row";

type KpiDetailResponse = {
  kpi: {
    id: number;
    code: string;
    name: string;
    unit: string;
    baseline: number | null;
    annualTarget: number | null;
    ownerLabel: string | null;
    department: { name: string } | null;
    polarity: string;
  };
  targets: {
    period: Period;
    targetValue: number | null;
    entry: { actualValue: number; achievementPct: number | null } | null;
  }[];
};

const QUARTERS: Period[] = ["Q1", "Q2", "Q3", "Q4"];

export default function KpiAnalysisModal({
  row,
  year,
  period,
  onClose,
  showStrategicLink = false,
}: {
  row: AnalysisKpiRow;
  year: number;
  period: Period;
  onClose: () => void;
  showStrategicLink?: boolean;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<KpiDetailResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/kpi/${row.kpiId}?year=${year}&period=${period}`);
      if (res.ok) setDetail(await res.json());
    } finally {
      setLoading(false);
    }
  }, [row.kpiId, year, period]);

  useEffect(() => {
    load();
  }, [load]);

  const status5 = classifyStatus5(row.actual, row.achievementPct);
  const deviationSigned =
    row.deviationPct != null
      ? row.deviationPct > 0
        ? `+${row.deviationPct}%`
        : `${row.deviationPct}%`
      : "—";

  const trendPoints: TrendPoint[] = QUARTERS.map((q) => {
    const t = detail?.targets.find((x) => x.period === q);
    return {
      label: PERIOD_LABEL[q],
      value: t?.entry?.achievementPct ?? null,
    };
  });

  const quarterlyRows = QUARTERS.map((q) => {
    const t = detail?.targets.find((x) => x.period === q);
    return {
      period: q,
      label: PERIOD_LABEL[q],
      pct: t?.entry?.achievementPct ?? null,
      actual: t?.entry?.actualValue ?? null,
      target: t?.targetValue ?? null,
    };
  });

  function exportPdf() {
    const prevTitle = document.title;
    document.title = `${row.name} — تحليل الأداء`;
    window.print();
    document.title = prevTitle;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={printRef}
        className="modal-panel card wide print-modal kpi-analysis-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head no-print">
          <div>
            <h3 style={{ marginBottom: ".25rem" }}>{row.name}</h3>
            <div className="text-muted">{row.code}</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <X {...ICON_PROPS} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <p className="text-muted">جاري تحميل التحليل...</p>
          ) : (
            <>
              <div className="field-grid" style={{ marginBottom: "1rem" }}>
                <div className="field-cell">
                  <div className="field-cell-label">خط الأساس</div>
                  <div className="field-cell-value">{row.baseline ?? "—"}</div>
                </div>
                <div className="field-cell">
                  <div className="field-cell-label">المستهدف السنوي</div>
                  <div className="field-cell-value">{row.annualTarget ?? "—"}</div>
                </div>
                <div className="field-cell">
                  <div className="field-cell-label">المستهدف الربعي</div>
                  <div className="field-cell-value">{row.target ?? "—"}</div>
                </div>
                <div className="field-cell">
                  <div className="field-cell-label">المتحقق الفعلي</div>
                  <div className="field-cell-value">{row.actual ?? "—"}</div>
                </div>
                <div className="field-cell">
                  <div className="field-cell-label">نسبة الإنجاز</div>
                  <div className="field-cell-value">
                    {row.achievementPct != null ? `${row.achievementPct}%` : "—"}
                  </div>
                </div>
                <div className="field-cell">
                  <div className="field-cell-label">نسبة الانحراف</div>
                  <div className="field-cell-value">{deviationSigned}</div>
                </div>
              </div>

              <Status5OwnerLine
                status={status5}
                ownerLabel={row.ownerLabel}
                departmentName={row.departmentName}
              />

              {showStrategicLink && row.strategicGoalCode && (
                <div className="field-cell" style={{ marginBottom: "1rem" }}>
                  <div className="field-cell-label">الارتباط بالهدف الاستراتيجي</div>
                  <div className="field-cell-value">
                    {row.strategicGoalCode}
                    {row.strategicGoalTitle ? ` — ${row.strategicGoalTitle}` : ""}
                  </div>
                </div>
              )}

              <h4 className="section-h">
                <BarChart3 {...ICON_PROPS} />
                تحليل اتجاه الأداء الزمني — {year}
              </h4>
              <div className="chart-wrap">
                <LineTrend points={trendPoints} />
              </div>

              <h4 className="section-h">التحليل المقارن للأداء الربعي</h4>
              <table className="tmkeen-table" style={{ marginBottom: "1rem" }}>
                <thead>
                  <tr>
                    <th>الربع</th>
                    <th>المستهدف</th>
                    <th>المتحقق</th>
                    <th>نسبة الإنجاز</th>
                  </tr>
                </thead>
                <tbody>
                  {quarterlyRows.map((q) => (
                    <tr key={q.period}>
                      <td>{q.label}</td>
                      <td>{q.target ?? "—"}</td>
                      <td>{q.actual ?? "—"}</td>
                      <td>{q.pct != null ? `${q.pct}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="modal-footer no-print">
          <button type="button" className="btn-secondary btn-sm" onClick={onClose}>
            إغلاق
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={exportPdf}>
            <Download {...ICON_PROPS} />
            تصدير PDF
          </button>
        </div>
      </div>
    </div>
  );
}
