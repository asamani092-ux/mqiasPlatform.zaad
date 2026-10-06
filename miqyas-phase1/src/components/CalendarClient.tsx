"use client";

import { useCallback, useEffect, useState } from "react";
import FilterBar, { FilterField } from "@/components/ui/FilterBar";
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

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
      startsAt: toLocalInput(ev.startsAt),
      endsAt: toLocalInput(ev.endsAt),
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
        <form className="card" onSubmit={save} style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>{editId ? "تعديل حدث" : "إضافة حدث"}</h3>
          <div className="grid grid-4" style={{ gap: ".75rem", marginBottom: ".75rem" }}>
            <div>
              <label className="label-field" htmlFor="cal-title">العنوان</label>
              <input
                id="cal-title"
                className="input-field"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="cal-start">البداية</label>
              <input
                id="cal-start"
                className="input-field"
                type="datetime-local"
                dir="ltr"
                required
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="cal-end">النهاية</label>
              <input
                id="cal-end"
                className="input-field"
                type="datetime-local"
                dir="ltr"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="cal-type">النوع</label>
              <select
                id="cal-type"
                className="input-field"
                value={form.eventType}
                onChange={(e) => setForm({ ...form, eventType: e.target.value })}
              >
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label className="label-field" htmlFor="cal-notes">ملاحظات</label>
            <textarea
              id="cal-notes"
              className="input-field"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <button type="submit" className="btn-primary">{editId ? "حفظ التعديل" : "إضافة"}</button>
            {editId ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setEditId(null); setForm(emptyForm); }}
              >
                إلغاء
              </button>
            ) : null}
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
                {canManage ? <th>إجراءات</th> : null}
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td data-label="العنوان">
                    <div>{ev.title}</div>
                    {ev.notes ? <div className="text-muted">{ev.notes}</div> : null}
                  </td>
                  <td data-label="البداية">{new Date(ev.startsAt).toLocaleString("ar-SA")}</td>
                  <td data-label="النوع"><span className="badge-neutral">{TYPE_LABEL[ev.eventType] || ev.eventType}</span></td>
                  <td data-label="أنشأه">{ev.createdBy.name}</td>
                  {canManage ? (
                    <td data-label="إجراءات">
                      <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
                        <button type="button" className="btn-secondary btn-sm" onClick={() => startEdit(ev)}>تعديل</button>
                        <button type="button" className="btn-secondary btn-sm" onClick={() => void remove(ev.id)}>حذف</button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
