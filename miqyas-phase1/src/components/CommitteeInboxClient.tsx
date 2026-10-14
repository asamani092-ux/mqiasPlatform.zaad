"use client";

import { useCallback, useEffect, useState } from "react";
import { UPLOAD_STATUS_LABEL } from "@/lib/committee-labels";
import { notifyToast } from "@/lib/ui-toast";

type Report = {
  id: number;
  title: string;
  summary: string | null;
  issuedAt: string | null;
  engagement: { title: string };
};
type Upload = {
  id: number;
  title: string;
  notes: string | null;
  fileName: string;
  status: string;
  uploadedBy: { name: string };
};
type Meeting = { id: number; title: string };

export default function CommitteeInboxClient({
  canManage,
  canUpload,
}: {
  canManage: boolean;
  canUpload: boolean;
}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [reportId, setReportId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/committee/inbox");
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("تعذّر التحميل");
      return;
    }
    const data = await res.json();
    setReports(data.reports);
    setUploads(data.uploads);
    setMeetings(data.meetings);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("title", title.trim());
    fd.set("notes", notes.trim());
    if (meetingId) fd.set("meetingId", meetingId);
    if (reportId) fd.set("reportId", reportId);
    const res = await fetch("/api/committee/inbox", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل الرفع");
      return;
    }
    notifyToast.success("رُفع ملف المراجع الخارجي من حساب داخلي");
    setTitle("");
    setNotes("");
    setFile(null);
    await load();
  }

  async function ack(id: number) {
    const res = await fetch("/api/committee/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "ACKNOWLEDGED" }),
    });
    if (!res.ok) {
      notifyToast.error("فشل التحديث");
      return;
    }
    await load();
  }

  return (
    <div className="stack-lg">
      <p className="muted">التقارير الصادرة من المراجعة الداخلية فقط. أوراق العمل غير ظاهرة. رفع المراجع الخارجي يتم من مستخدم داخلي بلا حساب خارجي.</p>
      <div className="card stack">
        <h2 className="section-title">تقارير صادرة</h2>
        {loading ? <p className="muted">جاري التحميل…</p> : reports.length === 0 ? <p className="muted">لا تقارير صادرة.</p> : reports.map((r) => (
          <article key={r.id}>
            <strong>{r.title}</strong>
            <div className="muted" style={{ fontSize: "0.85rem" }}>{r.engagement.title}{r.issuedAt ? ` · ${r.issuedAt.slice(0, 10)}` : ""}</div>
            {r.summary && <p>{r.summary}</p>}
          </article>
        ))}
      </div>
      {canUpload && (
        <form className="card stack" onSubmit={upload}>
          <h2 className="section-title">رفع ملف مراجع خارجي</h2>
          <div className="grid-2">
            <div>
              <label className="label-field">العنوان</label>
              <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="label-field">اجتماع مرتبط</label>
              <select className="input-field" value={meetingId} onChange={(e) => setMeetingId(e.target.value)}>
                <option value="">—</option>
                {meetings.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">تقرير داخلي مرتبط</label>
            <select className="input-field" value={reportId} onChange={(e) => setReportId(e.target.value)}>
              <option value="">—</option>
              {reports.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">ملاحظة</label>
            <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <label className="label-field">الملف</label>
            <input className="input-field" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
          </div>
          <button className="btn btn-primary" type="submit">رفع</button>
        </form>
      )}
      <div className="card stack">
        <h2 className="section-title">ملفات الرفع</h2>
        {uploads.length === 0 ? <p className="muted">لا ملفات.</p> : uploads.map((u) => (
          <div key={u.id} className="row gap" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <strong>{u.title}</strong>
              <div className="muted" style={{ fontSize: "0.85rem" }}>{u.fileName} · {UPLOAD_STATUS_LABEL[u.status]} · {u.uploadedBy.name}</div>
            </div>
            <div className="row gap">
              <a className="btn btn-ghost btn-sm" href={`/api/committee/inbox/${u.id}`}>تنزيل</a>
              {canManage && u.status !== "ACKNOWLEDGED" && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void ack(u.id)}>اطلاع</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
