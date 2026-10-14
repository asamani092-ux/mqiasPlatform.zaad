"use client";

import { useCallback, useEffect, useState } from "react";
import { notifyToast } from "@/lib/ui-toast";

type Meeting = { id: number; title: string; scheduledAt: string };
type Minute = {
  id: number;
  body: string;
  createdAt: string;
  meeting: { id: number; title: string; scheduledAt: string };
  createdBy: { name: string };
};

export default function CommitteeMinutesClient({ canManage }: { canManage: boolean }) {
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingId, setMeetingId] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/committee/minutes");
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("تعذّر التحميل");
      return;
    }
    const data = await res.json();
    setMinutes(data.minutes);
    setMeetings(data.meetings);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/committee/minutes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: Number(meetingId), body: body.trim() }),
    });
    if (!res.ok) {
      notifyToast.error("فشل الحفظ");
      return;
    }
    notifyToast.success("حُفظ المحضر");
    setBody("");
    await load();
  }

  return (
    <div className="stack-lg">
      {canManage && (
        <form className="card stack" onSubmit={save}>
          <h2 className="section-title">محضر اجتماع</h2>
          <div>
            <label className="label-field">الاجتماع</label>
            <select className="input-field" value={meetingId} onChange={(e) => setMeetingId(e.target.value)} required>
              <option value="">—</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">نص المحضر</label>
            <textarea className="input-field" rows={5} value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit">حفظ</button>
        </form>
      )}
      <div className="card stack">
        <h2 className="section-title">المحاضر</h2>
        {loading ? <p className="muted">جاري التحميل…</p> : minutes.length === 0 ? <p className="muted">لا محاضر.</p> : minutes.map((m) => (
          <article key={m.id}>
            <strong>{m.meeting.title}</strong>
            <div className="muted" style={{ fontSize: "0.85rem" }}>{m.createdBy.name}</div>
            <p style={{ whiteSpace: "pre-wrap" }}>{m.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
