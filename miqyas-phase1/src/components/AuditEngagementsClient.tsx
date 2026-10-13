"use client";

import { useCallback, useEffect, useState } from "react";
import { AUDIT_ENGAGEMENT_STATUS_LABEL } from "@/lib/audit-labels";
import { notifyToast } from "@/lib/ui-toast";

type Plan = { id: number; year: number; title: string; status: string };
type Dept = { id: number; name: string };
type Engagement = {
  id: number;
  title: string;
  objective: string | null;
  status: string;
  planId: number;
  departmentId: number | null;
  startsAt: string | null;
  endsAt: string | null;
  plan: { id: number; year: number; title: string };
  department: { id: number; name: string } | null;
  _count: { findings: number; workingPapers: number; reports: number };
};

const empty = {
  planId: "",
  title: "",
  objective: "",
  departmentId: "",
  status: "PLANNED",
  startsAt: "",
  endsAt: "",
};

export default function AuditEngagementsClient({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<Engagement[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [filterPlan, setFilterPlan] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const q = filterPlan ? `?planId=${filterPlan}` : "";
    const res = await fetch(`/api/audit/engagements${q}`);
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("تعذّر تحميل المهام");
      return;
    }
    const data = await res.json();
    setItems(data.engagements);
    setPlans(data.plans);
    setDepartments(data.departments);
  }, [filterPlan]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    const payload = {
      planId: Number(form.planId),
      title: form.title.trim(),
      objective: form.objective.trim() || null,
      departmentId: form.departmentId ? Number(form.departmentId) : null,
      status: form.status,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    };
    const res = await fetch("/api/audit/engagements", {
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

  function startEdit(item: Engagement) {
    setEditId(item.id);
    setForm({
      planId: String(item.planId),
      title: item.title,
      objective: item.objective ?? "",
      departmentId: item.departmentId ? String(item.departmentId) : "",
      status: item.status,
      startsAt: item.startsAt ? item.startsAt.slice(0, 10) : "",
      endsAt: item.endsAt ? item.endsAt.slice(0, 10) : "",
    });
  }

  return (
    <div className="stack-lg">
      <div className="card">
        <label className="label-field">تصفية حسب الخطة</label>
        <select
          className="input-field"
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
        >
          <option value="">كل الخطط</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.year} — {p.title}</option>
          ))}
        </select>
      </div>

      {canManage && (
        <form className="card stack" onSubmit={save}>
          <h2 className="section-title">{editId ? "تعديل مهمة" : "مهمة / برنامج جديد"}</h2>
          <div className="grid-2">
            <div>
              <label className="label-field">الخطة السنوية</label>
              <select
                className="input-field"
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                required
              >
                <option value="">— اختر —</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.year} — {p.title}</option>
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
                {Object.entries(AUDIT_ENGAGEMENT_STATUS_LABEL).map(([k, v]) => (
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
            <label className="label-field">الهدف</label>
            <textarea
              className="input-field"
              rows={2}
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
            />
          </div>
          <div className="grid-2">
            <div>
              <label className="label-field">الإدارة الخاضعة</label>
              <select
                className="input-field"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">من / إلى</label>
              <div className="row gap">
                <input
                  className="input-field"
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
                <input
                  className="input-field"
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="row gap">
            <button type="submit" className="btn btn-primary">{editId ? "حفظ" : "إضافة"}</button>
            {editId && (
              <button type="button" className="btn btn-ghost" onClick={() => { setEditId(null); setForm(empty); }}>
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}

      <div className="card">
        <h2 className="section-title">المهام والبرامج</h2>
        {loading ? (
          <p className="muted">جاري التحميل…</p>
        ) : items.length === 0 ? (
          <p className="muted">لا توجد مهام.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>الخطة</th>
                  <th>الإدارة</th>
                  <th>الحالة</th>
                  <th>ملاحظات</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.plan.year}</td>
                    <td>{item.department?.name ?? "—"}</td>
                    <td>{AUDIT_ENGAGEMENT_STATUS_LABEL[item.status] || item.status}</td>
                    <td>{item._count.findings}</td>
                    {canManage && (
                      <td>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(item)}>
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
