"use client";

import Link from "next/link";
import PeriodSelector from "@/components/PeriodSelector";
import DonutChart from "@/components/charts/DonutChart";
import {
  EARLY_WARNING_ACHIEVEMENT_THRESHOLD,
  RISK_BADGE,
  riskDonutSegments,
  type EarlyWarningRow,
  type EarlyWarningSummary,
} from "@/lib/early-warning-stats";
import { PERIOD_LABEL, type Period } from "@/lib/types";

function fmtNum(n: number): string {
  return n.toLocaleString("ar-SA", { maximumFractionDigits: 1 });
}

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
  const donutSegments = riskDonutSegments(rows);
  const deviationHref = `/deviation?year=${year}&period=${period}`;

  const statCards = [
    { num: summary.activeCount, lbl: "المؤشرات تحت العتبة", accent: "stat-card--danger" },
    { num: summary.highCount, lbl: "مرتفع", accent: "stat-card--danger" },
    { num: summary.mediumCount, lbl: "متوسط", accent: "stat-card--warning" },
    { num: summary.lowCount, lbl: "منخفض", accent: "stat-card--success" },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار الإنذار المبكر</h1>
          <div className="text-muted">
            مؤشرات معتمدة دون {EARLY_WARNING_ACHIEVEMENT_THRESHOLD}% — {PERIOD_LABEL[period]} {year}
          </div>
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
        <h3 style={{ marginBottom: ".75rem" }}>توزيع المؤشرات حسب مستوى الخطر</h3>
        <DonutChart
          segments={donutSegments.map((s) => ({
            name: s.name,
            value: s.value,
            color: s.color,
          }))}
          centerLabel={summary.activeCount > 0 ? String(summary.activeCount) : "—"}
          centerSubLabel="مؤشر معرض"
        />
      </div>

      <div className="card alert alert-info" style={{ marginBottom: "1rem" }}>
        تُعرض المؤشرات ذات القياسات المعتمدة (APPROVED) للفترة الحالية عندما تكون نسبة الإنجاز أقل من{" "}
        {EARLY_WARNING_ACHIEVEMENT_THRESHOLD}% (أو المتحقق/المستهدف &lt; 0.85). مستوى الخطر: مرتفع عند فجوة
        ≥30، متوسط ≥15، ومنخفض فيما عدا ذلك (الفجوة = 100 − الإنجاز). إشعارات الكرون تبقى مسارًا خلفيًا
        منفصلًا.
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tmkeen-table">
          <thead>
            <tr>
              <th>الرمز</th>
              <th>المؤشر</th>
              <th>المستهدف</th>
              <th>المتحقق</th>
              <th>الإنجاز %</th>
              <th>الفجوة %</th>
              <th>مستوى الخطر</th>
              <th>بطاقة الانحراف</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.kpiId}>
                <td>
                  <span className="badge-primary">{r.code}</span>
                </td>
                <td>{r.name}</td>
                <td>{fmtNum(r.target)}</td>
                <td>{fmtNum(r.actual)}</td>
                <td>{fmtNum(r.achievementPct)}%</td>
                <td>{fmtNum(r.gapPct)}%</td>
                <td>
                  <span className={RISK_BADGE[r.riskLevel] || "badge-secondary"}>
                    {r.riskLabel}
                  </span>
                </td>
                <td>
                  {r.deviationCardId != null ? (
                    <Link href={deviationHref} className="btn-secondary btn-sm">
                      بطاقة الانحراف
                    </Link>
                  ) : (
                    <span className="text-muted" style={{ fontSize: ".78rem" }}>
                      لا توجد بطاقة
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-muted" style={{ padding: "1rem" }}>
            لا توجد مؤشرات معتمدة تحت عتبة الإنذار لهذه الفترة.
          </p>
        )}
      </div>
    </>
  );
}
