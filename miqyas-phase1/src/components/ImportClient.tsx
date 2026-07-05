"use client";

import { useState } from "react";

type PreviewRow = {
  code: string;
  name: string;
  type: string;
  period: string;
  status: string;
  error?: string;
  departmentId: number | null;
  ownerLabel: string | null;
};

type Preview = {
  rows: PreviewRow[];
  summary: { total: number; new: number; update: number; errors: number };
};

export default function ImportClient() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function upload(file: File) {
    setLoading(true);
    setMsg("");
    setSummary(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: fd });
    setLoading(false);
    if (res.ok) {
      setPreview(await res.json());
    } else {
      const err = await res.json();
      setMsg(err.error || "فشل التحليل");
    }
  }

  async function confirmImport() {
    setLoading(true);
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setSummary(data);
      setPreview(null);
      setMsg("اكتمل الاستيراد بنجاح");
    } else {
      const err = await res.json();
      setMsg(err.error || "فشل الاستيراد");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>استيراد Excel</h1>
          <div className="sub">معاينة ثم تأكيد — ملف قياس الأداء 2026</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <label className="btn" style={{ cursor: "pointer" }}>
          اختيار ملف .xlsx
          <input type="file" hidden accept=".xlsx,.xls" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        </label>
        {loading && <span className="sub" style={{ marginRight: ".75rem" }}>جاري المعالجة...</span>}
      </div>

      {msg && (
        <div className={`alert ${msg.includes("نجاح") || msg.includes("اكتمل") ? "alert-success" : "alert-error"}`} style={{ marginBottom: "1rem" }}>
          {msg}
          {summary && (
            <div style={{ marginTop: ".5rem" }}>
              أُنشئ: {summary.created} · حُدّث: {summary.updated} · أخطاء: {summary.errors} · مؤشرات: {summary.kpiCount}
            </div>
          )}
        </div>
      )}

      {preview && (
        <>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <p>المجموع: {preview.summary.total} · جديد: {preview.summary.new} · تحديث: {preview.summary.update} · أخطاء: {preview.summary.errors}</p>
            <button type="button" className="btn" style={{ marginTop: ".75rem" }} disabled={loading || preview.summary.errors === preview.summary.total} onClick={confirmImport}>
              تأكيد الاستيراد
            </button>
          </div>
          <div className="card" style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>الرمز</th><th>الاسم</th><th>النوع</th><th>الفترة</th><th>الحالة</th><th>ملاحظة</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r, i) => (
                  <tr key={`${r.code}-${r.period}-${i}`}>
                    <td>{r.code}</td>
                    <td>{r.name}</td>
                    <td>{r.type}</td>
                    <td>{r.period}</td>
                    <td><span className={`badge ${r.status === "ERROR" ? "critical" : r.status === "NEW" ? "achieved" : "ontrack"}`}>{r.status}</span></td>
                    <td>{r.error || (r.ownerLabel ? `ownerLabel: ${r.ownerLabel}` : "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
