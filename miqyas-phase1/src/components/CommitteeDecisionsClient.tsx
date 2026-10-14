"use client";

import { useCallback, useEffect, useState } from "react";
import { DECISION_STATUS_LABEL } from "@/lib/committee-labels";
import { notifyToast } from "@/lib/ui-toast";

type Meeting = { id: number; title: string };
type Decision = {
  id: number;
  title: string;
  recommendation: string | null;
  ownerName: string | null;
  dueDate: string | null;
  status: string;
  meeting: { id: number; title: string } | null;
};

export default function CommitteeDecisionsClient({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<Decision[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [form, setForm] = useState({ meetingId: "", title: "", recommendation: "", ownerName: "", dueDate: "" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/committee/decisions");
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("تعذّر التحميل");
      return;
    }
    const data = await res.json();
    setItems(data.decisions);
    setMeetings(data.meetings);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/committee/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meetingId: form.meetingId ? Number(form.meetingId) : null,
        title: form.title.trim(),
        recommendation: form.recommendation.trim() || null,
        ownerName: form.ownerName.trim() || null,
        dueDate: form.dueDate || null,
      }),
    });
    if (!res.ok) {
      notifyToast.error("فشل الحفظ");
      return;
    }
    notifyToast.success("أُضيفت التوصية");
    setForm({ meetingId: "", title: "", recommendation: "", ownerName: "", dueDate: "" });
    await load();
  }

  async function setStatus(id: number, status: string) {
    const res = await fetch("/api/committee/decisions", {
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
          <h2 className="section-title">قرار / توصية</h2>
          <div className="grid-2">
            <div>
              <label className="label-field">العنوان</label>
              <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">الاجتماع</label>
              <select className="input-field" value={form.meetingId} onChange={(e) => setForm({ ...form, meetingId: e.target.value })}>
                <option value="">—</option>
                {meetings.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">التوصية</label>
            <textarea className="input-field" rows={3} value={form.recommendation} onChange={(e) => setForm({ ...form, recommendation: e.target.value })} />
          </div>
          <div className="grid-2">
            <div>
              <label className="label-field">المسؤول</label>
              <input className="input-field" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
            </div>
            <div>
              <label className="label-field">الاستحقاق</label>
              <input className="input-field" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">إضافة</button>
        </form>
      )}
      <div className="card stack">
        <h2 className="section-title">المتابعة</h2>
        {loading ? <p className="muted">جاري التحميل…</p> : items.length === 0 ? <p className="muted">لا قرارات.</p> : items.map((d) => (
          <div key={d.id} className="row gap" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <strong>{d.title}</strong>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                {DECISION_STATUS_LABEL[d.status]}{d.ownerName ? ` · ${d.ownerName}` : ""}{d.meeting ? ` · ${d.meeting.title}` : ""}
              </div>
              {d.recommendation && <p>{d.recommendation}</p>}
            </div>
            {canManage && d.status !== "DONE" && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void setStatus(d.id, "DONE")}>تنفيذ</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
