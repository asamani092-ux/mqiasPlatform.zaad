"use client";

import { useCallback, useEffect, useState } from "react";
import { MEETING_STATUS_LABEL } from "@/lib/committee-labels";
import { notifyToast } from "@/lib/ui-toast";

type Meeting = {
  id: number;
  title: string;
  scheduledAt: string;
  location: string | null;
  agenda: string | null;
  status: string;
  _count: { minutes: number; decisions: number };
};

const empty = { title: "", scheduledAt: "", location: "", agenda: "", status: "SCHEDULED" };

export default function CommitteeMeetingsClient({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<Meeting[]>([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/committee/meetings");
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("تعذّر التحميل");
      return;
    }
    const data = await res.json();
    setItems(data.meetings);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/committee/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        location: form.location.trim() || null,
        agenda: form.agenda.trim() || null,
        status: form.status,
      }),
    });
    if (!res.ok) {
      notifyToast.error("فشل الحفظ");
      return;
    }
    notifyToast.success("أُضيف الاجتماع");
    setForm(empty);
    await load();
  }

  async function setStatus(id: number, status: string) {
    const res = await fetch("/api/committee/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      notifyToast.error("فشل التحديث");
      return;
    }
    await load();
  }

  return (
    <div className="stack-lg">
      {canManage && (
        <form className="card stack" onSubmit={save}>
          <h2 className="section-title">اجتماع جديد</h2>
          <div className="grid-2">
            <div>
              <label className="label-field">العنوان</label>
              <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">الموعد</label>
              <input className="input-field" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
            </div>
          </div>
          <div className="grid-2">
            <div>
              <label className="label-field">المكان</label>
              <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="label-field">الحالة</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(MEETING_STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">الأجندة</label>
            <textarea className="input-field" rows={3} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit">إضافة</button>
        </form>
      )}
      <div className="card">
        <h2 className="section-title">جدول الاجتماعات</h2>
        {loading ? <p className="muted">جاري التحميل…</p> : items.length === 0 ? <p className="muted">لا اجتماعات.</p> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>الموعد</th>
                  <th>الحالة</th>
                  <th>محاضر</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div>{m.title}</div>
                      {m.agenda && <div className="muted" style={{ fontSize: "0.85rem" }}>{m.agenda}</div>}
                    </td>
                    <td>{new Date(m.scheduledAt).toLocaleString("ar-SA")}</td>
                    <td>{MEETING_STATUS_LABEL[m.status] || m.status}</td>
                    <td>{m._count.minutes}</td>
                    {canManage && (
                      <td>
                        {m.status !== "HELD" && (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void setStatus(m.id, "HELD")}>انعقد</button>
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
