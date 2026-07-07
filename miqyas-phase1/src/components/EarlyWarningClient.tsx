"use client";

import { useState } from "react";
import { Mail, MailCheck } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import DonutChart from "@/components/charts/DonutChart";
import KpiDetailDrawer from "@/components/KpiDetailDrawer";
import {
  RISK_BADGE,
  riskDonutSegments,
  type EarlyWarningRow,
  type EarlyWarningSummary,
} from "@/lib/early-warning-stats";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";

export default function EarlyWarningClient({
  rows,
  summary,
  year,
  period,
}: {
  rows: EarlyWarningRow[];
  summary: EarlyWarningSummary;
  year: number;
  period: Period;
}) {
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const donutSegments = riskDonutSegments(rows);

  const statCards = [
    { num: summary.activeCount, lbl: "التنبيهات النشطة", accent: "stat-card--danger" },
    { num: summary.highCount, lbl: "مرتفع", accent: "stat-card--danger" },
    { num: summary.mediumCount, lbl: "متوسط", accent: "stat-card--warning" },
    { num: summary.lowCount, lbl: "منخفض", accent: "stat-card--success" },
    { num: summary.distinctKpiCount, lbl: "المؤشرات المعرضة للخطر", accent: "stat-card--secondary" },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار الإنذار المبكر</h1>
          <div className="text-muted">تنبيهات {PERIOD_LABEL[period]} {year}</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
        {statCards.map((s) => (
          <div key={s.lbl} className={`card stat-card ${s.accent}`.trim()}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>توزيع التنبيهات حسب مستوى الخطر</h3>
        <DonutChart
          segments={donutSegments.map((s) => ({
            name: s.name,
            value: s.value,
            color: s.color,
          }))}
          centerLabel={summary.activeCount > 0 ? String(summary.activeCount) : "—"}
          centerSubLabel="تنبيه نشط"
        />
      </div>

      <div className="card alert alert-info" style={{ marginBottom: "1rem" }}>
        يُفعّل الإنذار في بداية الشهر الثالث من كل ربع (مارس / يونيو / سبتمبر / ديسمبر) عند
        تجاوز فجوة الأداء عن {summary.gapThresholdPct}% من المستهدف المتوقع حتى تاريخ القراءة
        (قابل للتعديل من إعدادات النظام).
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tmkeen-table">
          <thead>
            <tr>
              <th>المؤشر</th>
              <th>المتحقق حتى تاريخه</th>
              <th>المستهدف المتوقع حتى تاريخه</th>
              <th>الفجوة %</th>
              <th>مستوى الخطر</th>
              <th>المستلمون</th>
              <th>تاريخ التنبيه</th>
              <th>حالة البريد</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                style={{ cursor: "pointer" }}
                onClick={() => setDrawerId(r.kpiId)}
              >
                <td>
                  {r.kpiCode} — {r.kpiName}
                </td>
                <td>{r.actualToDate}</td>
                <td>{r.expectedToDate}</td>
                <td>{r.gapPct}%</td>
                <td>
                  <span className={RISK_BADGE[r.riskLevel] || "badge-secondary"}>
                    {r.riskLabel}
                  </span>
                </td>
                <td style={{ fontSize: ".75rem", maxWidth: "12rem" }}>{r.recipients}</td>
                <td>{new Date(r.createdAt).toLocaleDateString("ar-SA")}</td>
                <td>
                  {r.emailSent ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: ".25rem" }}>
                      <MailCheck {...ICON_PROPS} style={{ color: "var(--tmkeen-success)" }} />
                      مُرسل
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: ".25rem" }}>
                      <Mail {...ICON_PROPS} style={{ color: "var(--tmkeen-brand-gray)" }} />
                      لم يُرسل
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-muted" style={{ padding: "1rem" }}>
            لا توجد تنبيهات لهذه الفترة.
          </p>
        )}
      </div>

      <KpiDetailDrawer kpiId={drawerId} year={year} period={period} onClose={() => setDrawerId(null)} />
    </>
  );
}
