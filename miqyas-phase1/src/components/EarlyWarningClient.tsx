"use client";

import PeriodSelector from "@/components/PeriodSelector";
import { PERIOD_LABEL, type Period } from "@/lib/types";

type AlertRow = {
  id: number;
  kpiCode: string;
  kpiName: string;
  actualToDate: number;
  expectedToDate: number;
  gapPct: number;
  riskLevel: string;
  riskLabel: string;
  recipients: string;
  emailSent: boolean;
  createdAt: string;
};

const RISK_BADGE: Record<string, string> = { LOW: "badge-success", MEDIUM: "badge-primary", HIGH: "badge-danger" };

export default function EarlyWarningClient({
  rows,
  year,
  period,
}: {
  rows: AlertRow[];
  year: number;
  period: Period;
}) {
  return (
    <>
      <div className="topbar">
        <div>
          <h1>الإنذار المبكر</h1>
          <div className="text-muted">تنبيهات {PERIOD_LABEL[period]} {year}</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>
      <div className="card alert alert-info" style={{ marginBottom: "1rem" }}>
        يُفعّل الإنذار في بداية الشهر الثالث من كل ربع عند تجاوز فجوة الأداء للنسبة المحددة في الإعدادات.
      </div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tmkeen-table">
          <thead>
            <tr>
              <th>المؤشر</th><th>المتحقق</th><th>المستهدف المتوقع</th><th>الفجوة %</th>
              <th>مستوى الخطر</th><th>المستلمون</th><th>التاريخ</th><th>البريد</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.kpiCode} — {r.kpiName}</td>
                <td>{r.actualToDate}</td>
                <td>{r.expectedToDate}</td>
                <td>{r.gapPct}%</td>
                <td><span className={RISK_BADGE[r.riskLevel] || "badge-neutral"}>{r.riskLabel}</span></td>
                <td style={{ fontSize: ".75rem" }}>{r.recipients}</td>
                <td>{new Date(r.createdAt).toLocaleDateString("ar-SA")}</td>
                <td>{r.emailSent ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-muted" style={{ padding: "1rem" }}>لا توجد تنبيهات لهذه الفترة.</p>}
      </div>
    </>
  );
}
