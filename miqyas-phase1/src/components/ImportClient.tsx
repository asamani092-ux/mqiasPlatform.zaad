"use client";

import { useState } from "react";
import type { ParsedImportRow } from "@/lib/import-excel";

type Preview = {
  rows: ParsedImportRow[];
  summary: {
    total: number;
    new: number;
    update: number;
    errors: number;
    uniqueKpiCodes: number;
  };
  codeAnalysis: {
    uniqueCodes: string[];
    quarterOnlyFlags: { code: string; periods: string[]; missing: string[] }[];
  };
};

export default function ImportClient() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
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
    if (res.ok) setPreview(await res.json());
    else setMsg((await res.json()).error || "فشل التحليل");
  }

  async function confirmImport() {
    if (!preview) return;
    setLoading(true);
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true, rows: preview.rows }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setSummary(data);
      setPreview(null);
      setMsg("اكتمل الاستيراد بنجاح");
    } else {
      setMsg((await res.json()).error || "فشل الاستيراد");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>استيراد Excel</h1>
          <div className="text-muted">معاينة ثم تأكيد — الصفوف تُرسل مع طلب التأكيد</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <label className="btn-primary" style={{ cursor: "pointer" }}>
          اختيار ملف .xlsx
          <input type="file" hidden accept=".xlsx,.xls" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        </label>
        {loading && <span className="text-muted" style={{ marginRight: ".75rem" }}>جاري المعالجة...</span>}
      </div>

      {msg && (
        <div className={`alert ${msg.includes("اكتمل") ? "alert-success" : "alert-error"}`} style={{ marginBottom: "1rem" }}>
          {msg}
          {summary && (
            <div style={{ marginTop: ".5rem" }}>
              أُنشئ: {String(summary.created)} · حُدّث: {String(summary.updated)} · أخطاء: {String(summary.errors)} · مؤشرات: {String(summary.kpiCount)}
            </div>
          )}
        </div>
      )}

      {preview && (
        <>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <p>
              المجموع: {preview.summary.total} · جديد: {preview.summary.new} · تحديث: {preview.summary.update} ·
              أخطاء: {preview.summary.errors} · رموز فريدة: {preview.summary.uniqueKpiCodes}
            </p>
            <button type="button" className="btn-primary" style={{ marginTop: ".75rem" }} disabled={loading || preview.summary.errors === preview.summary.total} onClick={confirmImport}>
              تأكيد الاستيراد
            </button>
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3>رموز KPI الفريدة ({preview.codeAnalysis.uniqueCodes.length})</h3>
            <p className="text-muted" style={{ fontSize: ".78rem", marginBottom: ".5rem" }}>
              {preview.codeAnalysis.uniqueCodes.join("، ")}
            </p>
            {preview.codeAnalysis.quarterOnlyFlags.length > 0 && (
              <>
                <h4 style={{ marginTop: ".75rem", color: "var(--tmkeen-warning)" }}>رموز ناقصة في بعض الأرباع — للمراجعة</h4>
                <table className="tmkeen-table">
                  <thead><tr><th>الرمز</th><th>موجود في</th><th>ناقص</th></tr></thead>
                  <tbody>
                    {preview.codeAnalysis.quarterOnlyFlags.map((f) => (
                      <tr key={f.code}>
                        <td>{f.code}</td>
                        <td>{f.periods.join("، ")}</td>
                        <td><span className="badge-warning">{f.missing.join("، ")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="card" style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
            <table className="tmkeen-table">
              <thead>
                <tr><th>الرمز</th><th>الاسم</th><th>الفترة</th><th>الحالة</th><th>ملاحظة</th></tr>
              </thead>
              <tbody>
                {preview.rows.map((r, i) => (
                  <tr key={`${r.code}-${r.period}-${i}`}>
                    <td>{r.code}</td>
                    <td>{r.name}</td>
                    <td>{r.period}</td>
                    <td><span className={r.status === "ERROR" ? "badge-danger" : r.status === "NEW" ? "badge-success" : "badge-primary"}>{r.status}</span></td>
                    <td>{r.error || r.ownerLabel || ""}</td>
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
