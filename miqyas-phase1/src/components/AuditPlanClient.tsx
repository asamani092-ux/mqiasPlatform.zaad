"use client";

import { useCallback, useEffect, useState } from "react";
import { AUDIT_PLAN_STATUS_LABEL } from "@/lib/audit-labels";
import { notifyToast } from "@/lib/ui-toast";

type Plan = {
  id: number;
  year: number;
  title: string;
  status: string;
  notes: string | null;
  _count: { engagements: number };
  createdBy: { id: number; name: string };
};

const empty = { year: new Date().getFullYear(), title: "", notes: "", status: "DRAFT" };

export default function AuditPlanClient({ canManage }: { canManage: boolean }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/audit/plan");
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("تعذّر تحميل الخطط");
      return;
    }
    const data = await res.json();
    setPlans(data.plans);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    const payload = {
      year: Number(form.year),
      title: form.title.trim(),
      notes: form.notes.trim() || null,
      status: form.status,
    };
    const res = await fetch("/api/audit/plan", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل الحفظ");
      return;
    }
    notifyToast.success(editId ? "تم التحديث" : "تمت الإضافة");
    setForm(empty);
    setEditId(null);
    await load();
  }

  function startEdit(p: Plan) {
    setEditId(p.id);
    setForm({
      year: p.year,
      title: p.title,
      notes: p.notes ?? "",
      status: p.status,
    });
  }

  return (
    <div className="stack-lg">
      {canManage && (
        <form className="card stack" onSubmit={save}>
          <h2 className="section-title">{editId ? "تعديل الخطة" : "خطة سنوية جديدة"}</h2>
          <div className="grid-2">
            <div>
              <label className="label-field">السنة</label>
              <input
                className="input-field"
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="label-field">الحالة</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {Object.entries(AUDIT_PLAN_STATUS_LABEL).map(([k, v]) => (
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
            <label className="label-field">ملاحظات</label>
            <textarea
              className="input-field"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="row gap">
            <button type="submit" className="btn btn-primary">
              {editId ? "حفظ التعديل" : "إضافة"}
            </button>
            {editId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEditId(null);
                  setForm(empty);
                }}
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}

      <div className="card">
        <h2 className="section-title">الخطط السنوية</h2>
        {loading ? (
          <p className="muted">جاري التحميل…</p>
        ) : plans.length === 0 ? (
          <p className="muted">لا توجد خطط بعد.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>السنة</th>
                  <th>العنوان</th>
                  <th>الحالة</th>
                  <th>المهام</th>
                  <th>أنشأها</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td>{p.year}</td>
                    <td>{p.title}</td>
                    <td>{AUDIT_PLAN_STATUS_LABEL[p.status] || p.status}</td>
                    <td>{p._count.engagements}</td>
                    <td>{p.createdBy.name}</td>
                    {canManage && (
                      <td>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>
                          تعديل
                        </button>
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
