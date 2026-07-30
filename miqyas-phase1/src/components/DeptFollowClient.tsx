"use client";

import PeriodSelector from "@/components/PeriodSelector";
import {
  APPROVAL_BADGE,
  APPROVAL_LABEL,
  PERIOD_LABEL,
  type Period,
} from "@/lib/types";

export type DeptFollowRow = {
  id: number;
  code: string;
  name: string;
  unit: string;
  ownerName: string;
  actualValue: number | null;
  approvalStatus: string | null;
  evidenceCount: number;
};

export default function DeptFollowClient({
  year,
  period,
  rows,
}: {
  year: number;
  period: Period;
  rows: DeptFollowRow[];
}) {
  return (
    <>
      <div className="topbar">
        <div>
          <h1>متابعة الإدارة</h1>
          <div className="text-muted">
            عرض قراءة لمتطلبات القياس في إدارتك — {PERIOD_LABEL[period]} {year}
          </div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
        هذه الصفحة للعرض فقط. الاعتماد يتم من تبويب اعتماد القياسات عند تفعيل التفويض.
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <p className="text-muted">لا توجد متطلبات قياس مرتبطة بإدارتك.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>الرمز</th>
                <th>المتطلب</th>
                <th>المسؤول</th>
                <th>المتحقق</th>
                <th>حالة الاعتماد</th>
                <th>الشواهد</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.code}</strong>
                  </td>
                  <td>{r.name}</td>
                  <td>{r.ownerName}</td>
                  <td>
                    {r.actualValue != null ? (
                      <>
                        {r.actualValue}
                        {r.unit ? ` ${r.unit}` : ""}
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {r.approvalStatus ? (
                      <span className={APPROVAL_BADGE[r.approvalStatus] ?? "badge-neutral"}>
                        {APPROVAL_LABEL[r.approvalStatus] ?? r.approvalStatus}
                      </span>
                    ) : (
                      <span className="text-muted">لا إدخال</span>
                    )}
                  </td>
                  <td>{r.evidenceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
