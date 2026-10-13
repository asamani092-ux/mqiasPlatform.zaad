"use client";

import { useCallback, useEffect, useState } from "react";
import { notifyToast } from "@/lib/ui-toast";

type Engagement = { id: number; title: string };
type Paper = {
  id: number;
  title: string;
  fileName: string;
  visibility: string;
  sizeBytes: number;
  createdAt: string;
  engagement: { id: number; title: string };
  uploadedBy: { id: number; name: string };
};

export default function AuditPapersClient() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/audit/papers");
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("غير مصرح أو تعذّر التحميل");
      return;
    }
    const data = await res.json();
    setPapers(data.papers);
    setEngagements(data.engagements);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !engagementId || !title.trim()) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("title", title.trim());
    fd.set("engagementId", engagementId);
    const res = await fetch("/api/audit/papers", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل الرفع");
      return;
    }
    notifyToast.success("رُفعت ورقة العمل (INTERNAL_ONLY)");
    setTitle("");
    setFile(null);
    await load();
  }

  async function remove(id: number) {
    if (!confirm("حذف ورقة العمل؟")) return;
    const res = await fetch(`/api/audit/papers?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      notifyToast.error("فشل الحذف");
      return;
    }
    notifyToast.success("تم الحذف");
    await load();
  }

  return (
    <div className="stack-lg">
      <p className="muted">أوراق العمل سرية (`INTERNAL_ONLY`) — متاحة لفريق المراجعة والمشرف فقط.</p>

      <form className="card stack" onSubmit={upload}>
        <h2 className="section-title">رفع ورقة عمل</h2>
        <div className="grid-2">
          <div>
            <label className="label-field">المهمة</label>
            <select
              className="input-field"
              value={engagementId}
              onChange={(e) => setEngagementId(e.target.value)}
              required
            >
              <option value="">—</option>
              {engagements.map((eng) => (
                <option key={eng.id} value={eng.id}>{eng.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">العنوان</label>
            <input
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="label-field">الملف</label>
          <input
            className="input-field"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">رفع</button>
      </form>

      <div className="card">
        <h2 className="section-title">أوراق العمل</h2>
        {loading ? (
          <p className="muted">جاري التحميل…</p>
        ) : papers.length === 0 ? (
          <p className="muted">لا توجد أوراق عمل.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>المهمة</th>
                  <th>الملف</th>
                  <th>السرية</th>
                  <th>رفع بواسطة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {papers.map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td>{p.engagement.title}</td>
                    <td>{p.fileName}</td>
                    <td>{p.visibility}</td>
                    <td>{p.uploadedBy.name}</td>
                    <td className="row gap">
                      <a className="btn btn-ghost btn-sm" href={`/api/audit/papers/${p.id}`}>
                        تنزيل
                      </a>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => void remove(p.id)}>
                        حذف
                      </button>
                    </td>
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
