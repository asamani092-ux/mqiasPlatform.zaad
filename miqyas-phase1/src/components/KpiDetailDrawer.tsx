"use client";

import { useEffect, useState } from "react";
import { PERIOD_LABEL, STATUS_LABEL, STATUS_BADGE, type Period } from "@/lib/types";

type Detail = {
  kpi: Record<string, unknown>;
  targets: { period: string; targetValue: number; entry?: Record<string, unknown> }[];
  deviationCard: Record<string, unknown> | null;
};

export default function KpiDetailDrawer({
  kpiId,
  year,
  period,
  onClose,
}: {
  kpiId: number | null;
  year: number;
  period: Period;
  onClose: () => void;
}) {
  const [data, setData] = useState<Detail | null>(null);

  useEffect(() => {
    if (!kpiId) return;
    fetch(`/api/analytics/kpi/${kpiId}?year=${year}&period=${period}`)
      .then((r) => r.json())
      .then(setData);
  }, [kpiId, year, period]);

  if (!kpiId) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100, display: "flex", justifyContent: "flex-start" }}>
      <div className="card" style={{ width: "min(520px, 95vw)", height: "100vh", overflowY: "auto", borderRadius: 0, margin: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3>{data ? String((data.kpi as { name?: string }).name) : "..."}</h3>
          <button type="button" className="btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>
        {data && (
          <>
            <p className="sub">{(data.kpi as { code?: string }).code} · {(data.kpi as { unit?: string }).unit}</p>
            <div style={{ fontSize: ".82rem", marginBottom: "1rem" }}>
              <div>خط الأساس: {(data.kpi as { baseline?: number }).baseline ?? "—"}</div>
              <div>المستهدف السنوي: {(data.kpi as { annualTarget?: number }).annualTarget ?? "—"}</div>
              <div>البيانات المطلوبة: {(data.kpi as { requiredData?: string }).requiredData || "—"}</div>
            </div>
            <h4>المستهدفات vs المتحقق — {year}</h4>
            <table className="tbl" style={{ marginBottom: "1rem" }}>
              <thead><tr><th>الفترة</th><th>المستهدف</th><th>المتحقق</th><th>نسبة التحقق</th></tr></thead>
              <tbody>
                {data.targets.map((t) => (
                  <tr key={t.period}>
                    <td>{PERIOD_LABEL[t.period as Period] || t.period}</td>
                    <td>{t.targetValue}</td>
                    <td>{t.entry ? String((t.entry as { actualValue?: number }).actualValue) : "—"}</td>
                    <td>{t.entry ? `${(t.entry as { achievementPct?: number }).achievementPct ?? "—"}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.targets.filter((t) => t.entry).map((t) => (
              <div key={`n-${t.period}`} style={{ marginBottom: ".75rem", fontSize: ".82rem" }}>
                <strong>{PERIOD_LABEL[t.period as Period]} — ماذا/كيف حصل:</strong>
                <p>{(t.entry as { whatHappened?: string })?.whatHappened || "—"}</p>
                <p>{(t.entry as { howHappened?: string })?.howHappened || "—"}</p>
                {(t.entry as { evidences?: { id: number; fileName: string }[] })?.evidences?.map((ev) => (
                  <a key={ev.id} href={`/api/evidence/${ev.id}`} className="badge ontrack" style={{ marginLeft: ".3rem" }}>{ev.fileName}</a>
                ))}
              </div>
            ))}
            {data.deviationCard && (
              <div className="alert alert-warn">
                بطاقة انحراف: {(data.deviationCard as { deviationPct?: number }).deviationPct}% — {(data.deviationCard as { status?: string }).status}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
