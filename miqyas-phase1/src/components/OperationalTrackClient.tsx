"use client";

import { useState } from "react";
import PeriodSelector from "@/components/PeriodSelector";
import TrackStatCards, { StatusBadge } from "@/components/TrackStatCards";
import KpiDetailDrawer from "@/components/KpiDetailDrawer";
import type { KpiAnalyticsRow } from "@/lib/analytics";
import type { KpiStatus, Period } from "@/lib/types";

export default function OperationalTrackClient({
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
    const key = r.departmentName || r.ownerLabel || "غير محدد";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>المسار التشغيلي</h1>
          <div className="sub">مؤشرات الأداء التشغيلي — قيم معتمدة فقط</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>
      <TrackStatCards counts={counts} />
      {Array.from(groups.entries()).map(([dept, items]) => (
        <div key={dept} className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: ".75rem" }}>{dept}</h3>
          <table className="tbl">
            <thead>
              <tr>
                <th>الهدف التشغيلي</th><th>المؤشر</th><th>خط الأساس</th><th>المستهدف</th>
                <th>المتحقق</th><th>نسبة التحقق</th><th>الجهة</th><th>الارتباط الاستراتيجي</th><th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.kpiId} style={{ cursor: "pointer" }} onClick={() => setDrawerId(r.kpiId)}>
                  <td>{r.operationalGoalTitle || "—"}</td>
                  <td>{r.name}</td>
                  <td>{r.baseline ?? "—"}</td>
                  <td>{r.target ?? "—"}</td>
                  <td>{r.actual ?? "—"}</td>
                  <td>{r.achievementPct != null ? `${r.achievementPct}%` : "—"}</td>
                  <td>{r.sectionName || r.ownerLabel || r.departmentName || "—"}</td>
                  <td>{r.strategicGoalCode || "—"}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <KpiDetailDrawer kpiId={drawerId} year={year} period={period} onClose={() => setDrawerId(null)} />
    </>
  );
}
