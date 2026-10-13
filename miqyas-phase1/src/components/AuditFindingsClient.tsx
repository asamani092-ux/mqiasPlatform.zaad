"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AUDIT_ACTION_STATUS_LABEL,
  AUDIT_FINDING_STATUS_LABEL,
  AUDIT_SEVERITY_LABEL,
} from "@/lib/audit-labels";
import { notifyToast } from "@/lib/ui-toast";

type Engagement = { id: number; title: string };
type Dept = { id: number; name: string };
type Action = {
  id: number;
  description: string;
  status: string;
  dueDate: string;
  responsibleName: string | null;
  responsible: { id: number; name: string } | null;
};
type Finding = {
  id: number;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  riskNote: string | null;
  engagementId: number;
  departmentId: number | null;
  engagement: { id: number; title: string };
  department: { id: number; name: string } | null;
  actions: Action[];
};

const emptyFinding = {
  engagementId: "",
  title: "",
  description: "",
  severity: "MEDIUM",
  riskNote: "",
  departmentId: "",
};

export default function AuditFindingsClient({ canManage }: { canManage: boolean }) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyFinding);
  const [actionForm, setActionForm] = useState({
    findingId: "",
    description: "",
    responsibleName: "",
    dueDate: "",
  });
  const [filterEng, setFilterEng] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const q = filterEng ? `?engagementId=${filterEng}` : "";
    const res = await fetch(`/api/audit/findings${q}`);
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("تعذّر تحميل الملاحظات");
      return;
    }
    const data = await res.json();
    setFindings(data.findings);
    setEngagements(data.engagements);
    setDepartments(data.departments);
  }, [filterEng]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveFinding(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    const res = await fetch("/api/audit/findings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engagementId: Number(form.engagementId),
        title: form.title.trim(),
        description: form.description.trim() || null,
        severity: form.severity,
        riskNote: form.riskNote.trim() || null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل الحفظ");
      return;
    }
    notifyToast.success("تمت إضافة الملاحظة");
    setForm(emptyFinding);
    await load();
  }

  async function saveAction(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    const res = await fetch("/api/audit/findings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "action",
        findingId: Number(actionForm.findingId),
        description: actionForm.description.trim(),
        responsibleName: actionForm.responsibleName.trim() || null,
        dueDate: actionForm.dueDate,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل إضافة الإجراء");
      return;
    }
    notifyToast.success("تمت إضافة الإجراء");
    setActionForm({ findingId: "", description: "", responsibleName: "", dueDate: "" });
    await load();
  }

  async function setActionStatus(actionId: number, status: string) {
    const res = await fetch("/api/audit/findings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "action", actionId, status }),
    });
    if (!res.ok) {
      notifyToast.error("فشل تحديث الإجراء");
      return;
    }
    await load();
  }

  async function closeFinding(id: number, forceClose = false) {
    const res = await fetch("/api/audit/findings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "CLOSED", forceClose }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (!forceClose && err.error) {
        if (confirm(`${err.error}\nهل تريد الإغلاق القسري؟`)) {
          await closeFinding(id, true);
        }
        return;
      }
      notifyToast.error(err.error || "فشل الإغلاق");
      return;
    }
    notifyToast.success("أُغلقت الملاحظة");
    await load();
  }

  return (
    <div className="stack-lg">
      <div className="card">
        <label className="label-field">تصفية حسب المهمة</label>
        <select className="input-field" value={filterEng} onChange={(e) => setFilterEng(e.target.value)}>
          <option value="">كل المهام</option>
          {engagements.map((eng) => (
            <option key={eng.id} value={eng.id}>{eng.title}</option>
          ))}
        </select>
      </div>

      {canManage && (
        <>
          <form className="card stack" onSubmit={saveFinding}>
            <h2 className="section-title">ملاحظة / مخاطرة جديدة</h2>
            <div className="grid-2">
              <div>
                <label className="label-field">المهمة</label>
                <select
                  className="input-field"
                  value={form.engagementId}
                  onChange={(e) => setForm({ ...form, engagementId: e.target.value })}
                  required
                >
                  <option value="">—</option>
                  {engagements.map((eng) => (
                    <option key={eng.id} value={eng.id}>{eng.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">الخطورة</label>
                <select
                  className="input-field"
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                >
                  {Object.entries(AUDIT_SEVERITY_LABEL).map(([k, v]) => (
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
            <div className="grid-2">
              <div>
                <label className="label-field">الإدارة</label>
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
                <label className="label-field">ملاحظة مخاطرة</label>
                <input
                  className="input-field"
                  value={form.riskNote}
                  onChange={(e) => setForm({ ...form, riskNote: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label-field">الوصف</label>
              <textarea
                className="input-field"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">إضافة ملاحظة</button>
          </form>

          <form className="card stack" onSubmit={saveAction}>
            <h2 className="section-title">إجراء تصحيحي</h2>
            <div className="grid-2">
              <div>
                <label className="label-field">الملاحظة</label>
                <select
                  className="input-field"
                  value={actionForm.findingId}
                  onChange={(e) => setActionForm({ ...actionForm, findingId: e.target.value })}
                  required
                >
                  <option value="">—</option>
                  {findings.filter((f) => f.status !== "CLOSED").map((f) => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">الاستحقاق</label>
                <input
                  className="input-field"
                  type="date"
                  value={actionForm.dueDate}
                  onChange={(e) => setActionForm({ ...actionForm, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label-field">الوصف</label>
              <input
                className="input-field"
                value={actionForm.description}
                onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label-field">المسؤول (اسم)</label>
              <input
                className="input-field"
                value={actionForm.responsibleName}
                onChange={(e) => setActionForm({ ...actionForm, responsibleName: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">إضافة إجراء</button>
          </form>
        </>
      )}

      <div className="card stack">
        <h2 className="section-title">الملاحظات والمخاطر</h2>
        {loading ? (
          <p className="muted">جاري التحميل…</p>
        ) : findings.length === 0 ? (
          <p className="muted">لا توجد ملاحظات.</p>
        ) : (
          findings.map((f) => (
            <div key={f.id} className="stack" style={{ borderBottom: "1px solid var(--tmkeen-surface-border)", paddingBottom: "1rem" }}>
              <div className="row gap" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <div>
                  <strong>{f.title}</strong>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    {f.engagement.title} · {AUDIT_SEVERITY_LABEL[f.severity]} · {AUDIT_FINDING_STATUS_LABEL[f.status]}
                    {f.department ? ` · ${f.department.name}` : ""}
                  </div>
                </div>
                {canManage && f.status !== "CLOSED" && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void closeFinding(f.id)}>
                    إغلاق
                  </button>
                )}
              </div>
              {f.description && <p>{f.description}</p>}
              {f.actions.length > 0 && (
                <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {f.actions.map((a) => (
                    <li key={a.id} className="row gap" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                      <span>
                        {a.description}
                        <span className="muted"> — {AUDIT_ACTION_STATUS_LABEL[a.status]} · {a.dueDate.slice(0, 10)}</span>
                        {(a.responsibleName || a.responsible?.name) && (
                          <span className="muted"> · {a.responsibleName || a.responsible?.name}</span>
                        )}
                      </span>
                      {canManage && a.status !== "DONE" && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => void setActionStatus(a.id, "DONE")}
                        >
                          إنجاز
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
