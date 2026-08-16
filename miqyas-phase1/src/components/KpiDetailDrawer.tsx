"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, X } from "lucide-react";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";
import {
  evidenceDownloadUrl,
  evidencePreviewUrl,
  isPreviewableEvidence,
} from "@/lib/evidence-preview";

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
    <div className="zad-drawer-root" role="presentation">
      <button type="button" className="zad-drawer-backdrop" aria-label="إغلاق" onClick={onClose} />
      <aside
        className="zad-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل المؤشر"
      >
        <div className="zad-drawer-header">
          <h3 className="zad-drawer-title">
            {data ? String((data.kpi as { name?: string }).name) : "..."}
          </h3>
          <button type="button" className="icon-btn zad-drawer-close" onClick={onClose} aria-label="إغلاق">
            <X {...ICON_PROPS} />
          </button>
        </div>
        <div className="zad-drawer-body">
          {data ? (
            <>
              <p className="text-muted">
                {(data.kpi as { code?: string }).code} · {(data.kpi as { unit?: string }).unit}
              </p>
              <div style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
                <div>خط الأساس: {(data.kpi as { baseline?: number }).baseline ?? "—"}</div>
                <div>المستهدف السنوي: {(data.kpi as { annualTarget?: number }).annualTarget ?? "—"}</div>
                <div>البيانات المطلوبة: {(data.kpi as { requiredData?: string }).requiredData || "—"}</div>
              </div>
              <h4>المستهدفات vs المتحقق — {year}</h4>
              <div className="zad-table-wrap">
                <table className="tmkeen-table">
                  <thead>
                    <tr>
                      <th>الفترة</th>
                      <th>المستهدف</th>
                      <th>المتحقق</th>
                      <th>نسبة التحقق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.targets.map((t) => (
                      <tr key={t.period}>
                        <td>{PERIOD_LABEL[t.period as Period] || t.period}</td>
                        <td dir="ltr">{t.targetValue}</td>
                        <td dir="ltr">
                          {t.entry ? String((t.entry as { actualValue?: number }).actualValue) : "—"}
                        </td>
                        <td dir="ltr">
                          {t.entry
                            ? `${(t.entry as { achievementPct?: number }).achievementPct ?? "—"}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.targets
                .filter((t) => t.entry)
                .map((t) => (
                  <div
                    key={`n-${t.period}`}
                    style={{ marginBottom: "var(--space-3)", fontSize: "var(--text-sm)" }}
                  >
                    <strong>{PERIOD_LABEL[t.period as Period]} — ماذا/كيف حصل:</strong>
                    <p>{(t.entry as { whatHappened?: string })?.whatHappened || "—"}</p>
                    <p>{(t.entry as { howHappened?: string })?.howHappened || "—"}</p>
                    {(t.entry as { evidences?: { id: number; fileName: string; mimeType?: string | null }[] })?.evidences?.map(
                      (ev) => (
                        <span
                          key={ev.id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            marginInlineEnd: "var(--space-2)",
                            marginBlockEnd: "var(--space-1)",
                            flexWrap: "wrap",
                          }}
                        >
                          {isPreviewableEvidence(ev.mimeType, ev.fileName) ? (
                            <a
                              href={evidencePreviewUrl(ev.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="badge-primary"
                              title="معاينة"
                            >
                              <ExternalLink {...ICON_PROPS} size={12} /> {ev.fileName}
                            </a>
                          ) : (
                            <span className="badge-neutral">{ev.fileName}</span>
                          )}
                          <a
                            href={evidenceDownloadUrl(ev.id)}
                            className="btn-secondary btn-sm"
                            download={ev.fileName}
                            title="تنزيل"
                          >
                            <Download {...ICON_PROPS} size={12} /> تنزيل
                          </a>
                        </span>
                      )
                    )}
                  </div>
                ))}
              {data.deviationCard ? (
                <div className="alert alert-warn">
                  بطاقة انحراف: {(data.deviationCard as { deviationPct?: number }).deviationPct}% —{" "}
                  {(data.deviationCard as { status?: string }).status}
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-muted">جاري التحميل...</p>
          )}
        </div>
      </aside>
    </div>
  );
}
