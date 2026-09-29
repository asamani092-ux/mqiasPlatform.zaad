"use client";

import { useCallback, useEffect, useState } from "react";
import { notifyToast } from "@/lib/ui-toast";

type CalEvent = {
  id: number;
  title: string;
  startsAt: string;
  endsAt: string | null;
  eventType: string;
  notes: string | null;
  department: { id: number; name: string } | null;
  createdBy: { id: number; name: string };
};

const TYPE_LABEL: Record<string, string> = {
  GENERAL: "عام",
  MEETING: "اجتماع",
  DEADLINE: "استحقاق",
  MILESTONE: "معلم",
};

const emptyForm = {
  title: "",
  startsAt: "",
  endsAt: "",
  eventType: "GENERAL",
  notes: "",
};

export default function CalendarClient({ canManage }: { canManage: boolean }) {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/calendar");
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("تعذّر تحميل الرزنامة");
      return;
    }
    const data = await res.json();
    setEvents(data.events);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title.trim(),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      eventType: form.eventType,
      notes: form.notes.trim() || null,
    };
    const res = await fetch("/api/calendar", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل الحفظ");
      return;
    }
    notifyToast.success(editId ? "تم التحديث" : "تمت الإضافة");
    setForm(emptyForm);
    setEditId(null);
    await load();
  }

  async function remove(id: number) {
    if (!confirm("حذف هذا الحدث؟")) return;
    const res = await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      notifyToast.error("فشل الحذف");
      return;
    }
    notifyToast.success("تم الحذف");
    await load();
  }

  function startEdit(ev: CalEvent) {
    setEditId(ev.id);
    setForm({
      title: ev.title,
      startsAt: ev.startsAt.slice(0, 16),
      endsAt: ev.endsAt ? ev.endsAt.slice(0, 16) : "",
      eventType: ev.eventType,
      notes: ev.notes ?? "",
    });
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>رزنامة القسم</h1>
          <div className="text-muted">أحداث ومواعيد مكتب الاستراتيجية — قابلة للتعديل حسب الصلاحية</div>
        </div>
      </div>

      {canManage && (
        <form className="card" style={{ marginBottom: "1rem" }} onSubmit={save}>
          <h3 style={{ marginTop: 0 }}>{editId ? "تعديل حدث" : "إضافة حدث"}</h3>
          <div className="form-grid" style={{ display: "grid", gap: ".75rem", gridTemplateColumns: "repeat(auto-fit,minmax(12rem,1fr))" }}>
            <label>
              العنوان
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>
              البداية
              <input className="input" type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            </label>
            <label>
              النهاية
              <input className="input" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
            </label>
            <label>
              النوع
              <select className="input" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <label style={{ display: "block", marginTop: ".75rem" }}>
            ملاحظات
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <div style={{ marginTop: ".75rem", display: "flex", gap: ".5rem" }}>
            <button type="submit" className="btn-primary">{editId ? "حفظ التعديل" : "إضافة"}</button>
            {editId && (
              <button type="button" className="btn-secondary" onClick={() => { setEditId(null); setForm(emptyForm); }}>
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p className="text-muted">جاري التحميل…</p>
        ) : events.length === 0 ? (
          <p className="text-muted">لا أحداث بعد</p>
        ) : (
          <table className="tmkeen-table table--stack">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>البداية</th>
                <th>النوع</th>
                <th>أنشأه</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td data-label="العنوان">
                    <div>{ev.title}</div>
                    {ev.notes && <div className="text-muted" style={{ fontSize: ".78rem" }}>{ev.notes}</div>}
                  </td>
                  <td data-label="البداية">{new Date(ev.startsAt).toLocaleString("ar-SA")}</td>
                  <td data-label="النوع">{TYPE_LABEL[ev.eventType] || ev.eventType}</td>
                  <td data-label="أنشأه">{ev.createdBy.name}</td>
                  {canManage && (
                    <td>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => startEdit(ev)}>تعديل</button>{" "}
                      <button type="button" className="btn-secondary btn-sm" onClick={() => void remove(ev.id)}>حذف</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
