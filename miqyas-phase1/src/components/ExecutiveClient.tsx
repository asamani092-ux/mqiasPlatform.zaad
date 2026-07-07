"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import KpiDetailDrawer from "@/components/KpiDetailDrawer";
import DonutChart from "@/components/charts/DonutChart";
import { StatusBadge } from "@/components/TrackStatCards";
import { STATUS5_COLOR } from "@/lib/status5";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import type { ExecutiveSnapshot } from "@/lib/executive";
import { ICON_PROPS } from "@/lib/icon-props";

const CARD_LABEL: Record<string, string> = {
  OPEN: "مفتوحة",
  IN_PROGRESS: "قيد المعالجة",
  CLOSED: "مغلقة",
};

const CARD_BADGE: Record<string, string> = {
  OPEN: "badge-warning",
  IN_PROGRESS: "badge-warning",
  CLOSED: "badge-success",
};

export default function ExecutiveClient({
  snapshot,
  year,
  period,
}: {
  snapshot: ExecutiveSnapshot;
  year: number;
  period: Period;
}) {
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const { deviatedKpis, openDeviationCards, lateActions, activeAlerts, headline, status5Distribution } =
    snapshot;

  const donutSegments = status5Distribution
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.label,
      value: s.pct,
      color: STATUS5_COLOR[s.status],
    }));

  const statCards = [
    { id: "all", num: headline.totalKpis, lbl: "إجمالي المؤشرات", accent: "" },
    { id: "critical", num: `${headline.pctCritical}%`, lbl: "مؤشرات حرجة", accent: "stat-card--danger" },
    { id: "atrisk", num: `${headline.pctAtRisk}%`, lbl: "معرضة للخطر", accent: "stat-card--warning" },
    { id: "cards", num: headline.openCards, lbl: "بطاقات انحراف مفتوحة", accent: "stat-card--warning" },
    { id: "late", num: headline.lateActions, lbl: "إجراءات متأخرة", accent: "stat-card--danger" },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>لوحة الإدارة العليا</h1>
          <div className="text-muted">انحرافات وإجراءات متأخرة — {PERIOD_LABEL[period]} {year}</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
        {statCards.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`card stat-card ${s.accent}`.trim()}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </a>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>توزيع حالات المؤشرات (5 حالات)</h3>
        <DonutChart
          segments={donutSegments}
          centerLabel={
            headline.measuredKpis > 0
              ? `${headline.measuredKpis}`
              : "—"
          }
          centerSubLabel="مؤشرات مقيسة"
        />
      </div>

      <div id="critical" className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>المؤشرات المنحرفة</h3>
        {deviatedKpis.length === 0 ? (
          <p className="text-muted">لا توجد مؤشرات منحرفة لهذه الفترة — أداء ضمن المستهدف.</p>
        ) : (
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>الرمز</th><th>المؤشر</th><th>الجهة</th><th>المستهدف</th><th>المتحقق</th>
                <th>نسبة التحقق</th><th>الانحراف %</th><th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {deviatedKpis.map((k) => (
                <tr key={k.kpiId} style={{ cursor: "pointer" }} onClick={() => setDrawerId(k.kpiId)}>
                  <td>{k.code}</td>
                  <td>{k.name}</td>
                  <td>{k.departmentName || k.ownerLabel || "—"}</td>
                  <td>{k.target}</td>
                  <td>{k.actual}</td>
                  <td>{k.achievementPct != null ? `${k.achievementPct}%` : "—"}</td>
                  <td style={{ color: "var(--tmkeen-danger)", fontWeight: 700 }}>{k.deviationPct != null ? `${k.deviationPct}%` : "—"}</td>
                  <td><StatusBadge status={k.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div id="late" className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>الإجراءات التصحيحية المتأخرة</h3>
        {lateActions.length === 0 ? (
          <p className="text-muted">لا توجد إجراءات متأخرة — جميع المعالجات ضمن الإطار الزمني.</p>
        ) : (
          <table className="tmkeen-table">
            <thead>
              <tr><th>الإجراء</th><th>المؤشر</th><th>المسؤول</th><th>تاريخ الاستحقاق</th><th>أيام التأخير</th><th>الحالة</th></tr>
            </thead>
            <tbody>
              {lateActions.map((a) => (
                <tr key={a.id}>
                  <td>{a.description}</td>
                  <td>{a.kpiName}</td>
                  <td>{a.responsible}</td>
                  <td>{new Date(a.dueDate).toLocaleDateString("ar-SA")}</td>
                  <td style={{ color: "var(--tmkeen-danger)", fontWeight: 700 }}>{a.daysLate}</td>
                  <td><Link href="/deviation">{a.status === "LATE" ? "متأخر" : "قيد التنفيذ"}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div id="cards" className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>بطاقات الانحراف غير المغلقة</h3>
        {openDeviationCards.length === 0 ? (
          <p className="text-muted">لا توجد بطاقات انحراف مفتوحة لهذه الفترة.</p>
        ) : (
          <div className="grid grid-3">
            {openDeviationCards.map((c) => (
              <div key={c.id} className="card" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, marginBottom: ".35rem" }}>{c.kpiName}</div>
                <div style={{ fontSize: ".82rem", color: "var(--tmkeen-danger)", fontWeight: 700 }}>انحراف {c.deviationPct}%</div>
                <div style={{ fontSize: ".78rem", margin: ".35rem 0" }}>{c.openActions} إجراء مفتوح</div>
                <span className={CARD_BADGE[c.status] || "badge-warning"}>{CARD_LABEL[c.status] || c.status}</span>
                <div style={{ marginTop: ".5rem" }}>
                  <Link href="/deviation" className="btn-secondary btn-sm">عرض البطاقة</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div id="alerts" className="card">
        <h3 style={{ marginBottom: ".75rem" }}>الإنذارات النشطة</h3>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge-danger">مرتفع: {activeAlerts.HIGH}</span>
          <span className="badge-primary">متوسط: {activeAlerts.MEDIUM}</span>
          <span className="badge-success">منخفض: {activeAlerts.LOW}</span>
          <Link href="/early-warning" className="btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: ".35rem" }}>
            عرض التفاصيل
            <ArrowLeft {...ICON_PROPS} />
          </Link>
        </div>
        {activeAlerts.HIGH + activeAlerts.MEDIUM + activeAlerts.LOW === 0 && (
          <p className="text-muted" style={{ marginTop: ".75rem" }}>لا توجد إنذارات نشطة لهذه الفترة.</p>
        )}
      </div>

      <KpiDetailDrawer kpiId={drawerId} year={year} period={period} onClose={() => setDrawerId(null)} />
    </>
  );
}
