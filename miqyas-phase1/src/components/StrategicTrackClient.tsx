"use client";

import { useState } from "react";
import PeriodSelector from "@/components/PeriodSelector";
import TrackStatCards, { StatusBadge } from "@/components/TrackStatCards";
import KpiDetailDrawer from "@/components/KpiDetailDrawer";
import type { KpiAnalyticsRow } from "@/lib/analytics";
import type { KpiStatus, Period } from "@/lib/types";

export default function StrategicTrackClient({
  rows,
  counts,
  year,
  period,
}: {
  rows: KpiAnalyticsRow[];
  counts: Record<KpiStatus, number>;
  year: number;
  period: Period;
}) {
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const groups = new Map<string, KpiAnalyticsRow[]>();
  for (const r of rows) {
    const key = r.strategicGoalTitle || "بدون هدف استراتيجي";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>المسار الاستراتيجي</h1>
          <div className="text-muted">مؤشرات الأداء الاستراتيجي — قيم معتمدة فقط</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>
      <TrackStatCards counts={counts} />
      {Array.from(groups.entries()).map(([goal, items]) => (
        <div key={goal} className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: ".75rem", color: "var(--tmkeen-primary)" }}>{goal}</h3>
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>رمز</th><th>المؤشر</th><th>خط الأساس</th><th>المستهدف السنوي</th>
                <th>مستهدف الفترة</th><th>المتحقق</th><th>نسبة التحقق</th><th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.kpiId} style={{ cursor: "pointer" }} onClick={() => setDrawerId(r.kpiId)}>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.baseline ?? "—"}</td>
                  <td>{r.annualTarget ?? "—"}</td>
                  <td>{r.target ?? "—"}</td>
                  <td>{r.actual ?? "—"}</td>
                  <td>{r.achievementPct != null ? `${r.achievementPct}%` : "—"}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {rows.length === 0 && <div className="card"><p className="text-muted">لا توجد مؤشرات في نطاق صلاحياتك.</p></div>}
      <KpiDetailDrawer kpiId={drawerId} year={year} period={period} onClose={() => setDrawerId(null)} />
    </>
  );
}
