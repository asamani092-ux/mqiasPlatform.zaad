"use client";

import { useCallback, useEffect, useState } from "react";
import { AUDIT_REPORT_STATUS_LABEL } from "@/lib/audit-labels";
import { notifyToast } from "@/lib/ui-toast";

type Engagement = { id: number; title: string };
type Report = {
  id: number;
  title: string;
  summary: string | null;
  status: string;
  issuedAt: string | null;
  fileName: string | null;
  engagement: { id: number; title: string };
  createdBy: { id: number; name: string };
};

export default function AuditReportsClient({ canManage }: { canManage: boolean }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    engagementId: "",
    title: "",
    summary: "",
    status: "DRAFT",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/audit/reports");
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("تعذّر تحميل التقارير");
      return;
    }
    const data = await res.json();
    setReports(data.reports);
    setEngagements(data.engagements ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    const res = await fetch("/api/audit/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engagementId: Number(form.engagementId),
        title: form.title.trim(),
        summary: form.summary.trim() || null,
        status: form.status,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل الحفظ");
      return;
    }
    notifyToast.success("تم حفظ التقرير");
    setForm({ engagementId: "", title: "", summary: "", status: "DRAFT" });
    await load();
  }

  async function issue(id: number) {
    const res = await fetch("/api/audit/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "ISSUED" }),
    });
    if (!res.ok) {
      notifyToast.error("فشل الإصدار");
      return;
    }
    notifyToast.success("صَدر التقرير");
    await load();
  }

  return (
    <div className="stack-lg">
      <p className="muted">التقارير الصادرة لا تكشف أوراق العمل السرية.</p>

      {canManage && (
        <form className="card stack" onSubmit={save}>
          <h2 className="section-title">تقرير مراجعة</h2>
          <div className="grid-2">
            <div>
              <label className="label-field">المهمة</label>
              <select
                className="input-field"
                value={form.engagementId}
                onChange={(e) => setForm({ ...form, engagementId: e.target.value })}
                required
              >
                <option value="">—</option>
                {engagements.map((eng) => (
                  <option key={eng.id} value={eng.id}>{eng.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">الحالة</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {Object.entries(AUDIT_REPORT_STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">العنوان</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-field">الملخص</label>
            <textarea
              className="input-field"
              rows={3}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary">حفظ</button>
        </form>
      )}

      <div className="card">
        <h2 className="section-title">التقارير</h2>
        {loading ? (
          <p className="muted">جاري التحميل…</p>
        ) : reports.length === 0 ? (
          <p className="muted">لا توجد تقارير.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>المهمة</th>
                  <th>الحالة</th>
                  <th>تاريخ الإصدار</th>
                  <th>بواسطة</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div>{r.title}</div>
                      {r.summary && <div className="muted" style={{ fontSize: "0.85rem" }}>{r.summary}</div>}
                    </td>
                    <td>{r.engagement.title}</td>
                    <td>{AUDIT_REPORT_STATUS_LABEL[r.status] || r.status}</td>
                    <td>{r.issuedAt ? r.issuedAt.slice(0, 10) : "—"}</td>
                    <td>{r.createdBy.name}</td>
                    {canManage && (
                      <td>
                        {r.status !== "ISSUED" && (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void issue(r.id)}>
                            إصدار
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
