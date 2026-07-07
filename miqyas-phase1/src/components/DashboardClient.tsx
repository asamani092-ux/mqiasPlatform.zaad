"use client";

import DonutChart from "@/components/charts/DonutChart";
import { CHART_COLORS } from "@/lib/chart-colors";
import type { DashboardOverview } from "@/lib/dashboard-overview";
import { PERIOD_LABEL, STATUS_BADGE, STATUS_LABEL, type KpiStatus } from "@/lib/types";

const DONUT_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
];

export default function DashboardClient({
  overview,
  byStatus,
  userName,
}: {
  overview: DashboardOverview;
  byStatus: Record<string, number>;
  userName: string;
}) {
  const { year, period } = overview;
  const pct = (v: number | null) => (v != null ? `${v}%` : "—");

  const trackTiles = [
    { num: pct(overview.strategicPct), lbl: "الأداء الاستراتيجي", accent: "stat-card--success" },
    { num: pct(overview.operationalPct), lbl: "الأداء التشغيلي", accent: "" },
    { num: `${overview.governancePct}%`, lbl: "مسار الحوكمة", accent: "stat-card--secondary" },
    { num: `${overview.knowledgePct}%`, lbl: "المعرفة المؤسسية", accent: "stat-card--warning" },
    { num: overview.earlyWarningCount, lbl: "مؤشرات الإنذار المبكر الفعّالة", accent: "stat-card--danger" },
    { num: overview.approvedEntriesCount, lbl: "إجمالي المؤشرات المعتمدة", accent: "" },
  ];

  const donutSegments = overview.donutSegments.map((s, i) => ({
    name: s.name,
    value: s.value,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  return (
    <>
      <div className="topbar">
        <div>
          <h1>اللوحة الرئيسية</h1>
          <div className="text-muted">
            أهلًا {userName} · {PERIOD_LABEL[period]} {year}
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: ".75rem" }}>نظرة إجمالية على أداء المنصة</h3>
      <div className="grid grid-3" style={{ marginBottom: "1rem" }}>
        {trackTiles.map((s) => (
          <div key={s.lbl} className={`card stat-card ${s.accent}`.trim()}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>التوزيع النسبي للأداء</h3>
        <DonutChart
          segments={donutSegments}
          centerLabel={overview.overallPct != null ? `${overview.overallPct}%` : "—"}
          centerSubLabel="الإنجاز الكلي"
        />
      </div>

      <div className="card">
        <h3>
          توزيع حالات المؤشرات المعتمدة — {PERIOD_LABEL[period]} {year}
        </h3>
        {Object.keys(byStatus).length === 0 ? (
          <p className="text-muted">لا توجد قياسات معتمدة لهذه الفترة بعد.</p>
        ) : (
          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
            {(Object.keys(byStatus) as KpiStatus[]).map((s) => (
              <span key={s} className={STATUS_BADGE[s]}>
                {STATUS_LABEL[s]} · {byStatus[s]}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
