"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, CheckCircle2, FileWarning, PencilLine } from "lucide-react";
import { PERIOD_LABEL, FILLER_ROLE_LABEL, type Period } from "@/lib/types";
import { TYPE_LABEL as KPI_TYPE } from "@/lib/kpi-schemas";
import { notifyToast } from "@/lib/ui-toast";
import ActionToolbar, { IconActionButton } from "@/components/ui/ActionToolbar";

type Entry = {
  id: number;
  measurementPeriodId: number;
  year: number;
  period: string;
  actualValue: number;
  whatHappened: string | null;
  howHappened: string | null;
  note: string | null;
  suggestedWording: string | null;
  requirement: {
    code: string;
    name: string;
    unit: string;
    requiredData: string | null;
    fillerRole: string;
    owner: { id: number; name: string; email: string } | null;
    department: { name: string } | null;
    kpis: { id: number; code: string; name: string; type: string }[];
  };
  employee: { id: number; name: string; email: string };
  initialApprovedBy: { id: number; name: string } | null;
  evidences: {
    id: number;
    fileName: string;
    status: string;
    rejectReason: string | null;
  }[];
};

type Mode = "full" | "wording" | "evidence" | null;

type FormState = {
  what: string;
  how: string;
  actual: string;
  rejectReason: string;
  suggestedWording: string;
  evidenceReasons: Record<number, string>;
};

export default function ApprovalsClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [mode, setMode] = useState<Record<number, Mode>>({});
  const [forms, setForms] = useState<Record<number, FormState>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/approvals");
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
      const next: Record<number, FormState> = {};
      for (const e of data.entries as Entry[]) {
        next[e.id] = {
          what: e.whatHappened ?? "",
          how: e.howHappened ?? "",
          actual: String(e.actualValue),
          rejectReason: "",
          suggestedWording: e.suggestedWording ?? "",
          evidenceReasons: {},
        };
      }
      setForms(next);
    } else if (res.status === 403) {
      notifyToast.error("الاعتماد النهائي لمشرف النظام فقط");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleMode(id: number, next: Mode) {
    setMode((prev) => ({ ...prev, [id]: prev[id] === next ? null : next }));
  }

  async function run(
    id: number,
    action: "final_approve" | "reject_wording" | "reject_evidence" | "reject_full" | "edit"
  ) {
    const f = forms[id];
    const entry = entries.find((e) => e.id === id);
    if (!f || !entry) return;

    if ((action === "reject_wording" || action === "reject_full") && f.rejectReason.trim().length < 3) {
      notifyToast.error(action === "reject_full" ? "سبب الرفض الكامل مطلوب" : "سبب رفض الصياغة مطلوب");
      return;
    }
    if (action === "reject_evidence") {
      const selected = Object.entries(f.evidenceReasons).filter(([, r]) => r.trim().length >= 3);
      if (selected.length === 0 && f.rejectReason.trim().length < 3) {
        notifyToast.error("اكتب سبب رفض لكل شاهد محدد، أو سبباً عاماً لكل الشواهد");
        return;
      }
    }
    if (action === "final_approve") {
      const dirty =
        f.actual !== String(entry.actualValue) ||
        f.what !== (entry.whatHappened ?? "") ||
        f.how !== (entry.howHappened ?? "");
      if (dirty && !window.confirm("سيتم حفظ تعديلاتك مع الاعتماد النهائي. متابعة؟")) {
        return;
      }
    }

    setActing(id);
    const body: Record<string, unknown> = {
      measurementPeriodId: id,
      action,
      actualValue: f.actual ? parseFloat(f.actual) : undefined,
      whatHappened: f.what || null,
      howHappened: f.how || null,
    };
    if (action === "reject_wording" || action === "reject_full") {
      body.rejectReason = f.rejectReason.trim();
      body.suggestedWording = f.suggestedWording || null;
    }
    if (action === "reject_evidence") {
      const evidenceRejections = Object.entries(f.evidenceReasons)
        .filter(([, reason]) => reason.trim().length >= 3)
        .map(([evidenceId, reason]) => ({
          evidenceId: parseInt(evidenceId, 10),
          reason: reason.trim(),
        }));
      body.evidenceRejections = evidenceRejections;
      body.rejectReason = f.rejectReason.trim() || evidenceRejections[0]?.reason;
    }

    const res = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setActing(null);
    if (res.ok) {
      const msg =
        action === "final_approve"
          ? "تم الاعتماد النهائي"
          : action === "reject_full"
            ? "رُفض القياس بالكامل وأُعيد للمدخل"
            : action === "reject_wording"
              ? "رُفضت الصياغة وأُعيد للمدخل"
              : action === "reject_evidence"
                ? "رُفضت الشواهد المحددة وأُعيد للمدخل"
                : "تم حفظ التعديل";
      notifyToast.success(msg, { duration: "short" });
      setMode((m) => ({ ...m, [id]: null }));
      await load();
    } else {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشلت العملية");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>الاعتماد النهائي</h1>
          <div className="text-muted">تعديل · اعتماد · رفض كامل أو جزئي — مشرف النظام فقط</div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
        <strong>دورك هنا:</strong> راجع المعتمد مبدئياً، عدّل إن لزم، ثم اعتمد نهائياً أو ارفض
        (كامل / صياغة / شاهد محدد). الاعتماد المبدئي لمدير الإدارة فقط.
      </div>

      {loading ? (
        <p className="text-muted">جاري التحميل...</p>
      ) : entries.length === 0 ? (
        <div className="card">
          <p className="text-muted">لا توجد قياسات بانتظار الاعتماد النهائي.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {entries.map((e) => {
            const f = forms[e.id] ?? {
              what: "",
              how: "",
              actual: "",
              rejectReason: "",
              suggestedWording: "",
              evidenceReasons: {},
            };
            const m = mode[e.id] ?? null;
            const activeEvidences = e.evidences.filter((ev) => ev.status !== "REJECTED");

            return (
              <div key={e.id} className="card">
                <div style={{ marginBottom: ".65rem" }}>
                  <strong style={{ fontSize: "1.05rem" }}>{e.requirement.code}</strong>
                  {" — "}
                  {e.requirement.name}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: ".35rem .75rem",
                      marginTop: ".45rem",
                      fontSize: ".85rem",
                    }}
                  >
                    <div>
                      <span className="text-muted">الإدارة المالكة: </span>
                      {e.requirement.department?.name || "—"}
                    </div>
                    <div>
                      <span className="text-muted">المسؤول: </span>
                      {e.requirement.owner?.name || "—"}
                    </div>
                    <div>
                      <span className="text-muted">أدخلها: </span>
                      {e.employee.name}
                      {" ("}
                      {FILLER_ROLE_LABEL[e.requirement.fillerRole] || e.requirement.fillerRole}
                      {")"}
                    </div>
                    <div>
                      <span className="text-muted">اعتماد مبدئي: </span>
                      {e.initialApprovedBy?.name || "—"}
                    </div>
                    <div>
                      <span className="text-muted">الفترة: </span>
                      {PERIOD_LABEL[e.period as Period] || e.period} {e.year}
                    </div>
                  </div>
                </div>

                {e.requirement.kpis.length > 0 && (
                  <div style={{ marginBottom: ".65rem", fontSize: ".82rem" }}>
                    <span className="text-muted">المؤشرات المرتبطة: </span>
                    {e.requirement.kpis
                      .map(
                        (k) =>
                          `${k.code} (${KPI_TYPE[k.type as keyof typeof KPI_TYPE] ?? k.type})`
                      )
                      .join(" · ")}
                  </div>
                )}

                {e.requirement.requiredData && (
                  <div className="alert alert-info" style={{ marginBottom: ".65rem" }}>
                    البيانات المطلوبة: {e.requirement.requiredData}
                  </div>
                )}

                <div className="grid grid-3" style={{ marginBottom: ".75rem", gap: ".75rem" }}>
                  <div>
                    <label className="label-field">المتحقق ({e.requirement.unit})</label>
                    <input
                      className="input-field"
                      type="number"
                      step="any"
                      value={f.actual}
                      onChange={(ev) =>
                        setForms((prev) => ({ ...prev, [e.id]: { ...f, actual: ev.target.value } }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label-field">ماذا حصل؟</label>
                    <textarea
                      className="input-field"
                      rows={3}
                      value={f.what}
                      onChange={(ev) =>
                        setForms((prev) => ({ ...prev, [e.id]: { ...f, what: ev.target.value } }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label-field">كيف حصل؟</label>
                    <textarea
                      className="input-field"
                      rows={3}
                      value={f.how}
                      onChange={(ev) =>
                        setForms((prev) => ({ ...prev, [e.id]: { ...f, how: ev.target.value } }))
                      }
                    />
                  </div>
                </div>

                <div style={{ marginBottom: ".75rem" }}>
                  <div className="label-field">الشواهد ({activeEvidences.length})</div>
                  {activeEvidences.length === 0 ? (
                    <span className="text-muted">لا شواهد نشطة</span>
                  ) : (
                    activeEvidences.map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          display: "flex",
                          gap: ".5rem",
                          alignItems: "center",
                          marginBottom: ".35rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <a href={`/api/evidence/${ev.id}`} className="badge-primary">
                          {ev.fileName}
                        </a>
                        {m === "evidence" && (
                          <input
                            className="input-field"
                            style={{ maxWidth: 320 }}
                            placeholder="سبب رفض هذا الشاهد فقط"
                            value={f.evidenceReasons[ev.id] ?? ""}
                            onChange={(x) =>
                              setForms((prev) => ({
                                ...prev,
                                [e.id]: {
                                  ...f,
                                  evidenceReasons: {
                                    ...f.evidenceReasons,
                                    [ev.id]: x.target.value,
                                  },
                                },
                              }))
                            }
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {(m === "full" || m === "wording") && (
                  <div style={{ marginBottom: ".75rem", display: "grid", gap: ".5rem" }}>
                    <div>
                      <label className="label-field">
                        {m === "full" ? "سبب الرفض الكامل" : "سبب رفض الصياغة"}
                      </label>
                      <textarea
                        className="input-field"
                        rows={2}
                        value={f.rejectReason}
                        onChange={(ev) =>
                          setForms((prev) => ({
                            ...prev,
                            [e.id]: { ...f, rejectReason: ev.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="label-field">الصياغة المقترحة (اختياري)</label>
                      <textarea
                        className="input-field"
                        rows={3}
                        value={f.suggestedWording}
                        onChange={(ev) =>
                          setForms((prev) => ({
                            ...prev,
                            [e.id]: { ...f, suggestedWording: ev.target.value },
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      disabled={acting === e.id}
                      onClick={() => void run(e.id, m === "full" ? "reject_full" : "reject_wording")}
                    >
                      {m === "full" ? "تأكيد الرفض الكامل" : "تأكيد رفض الصياغة"}
                    </button>
                  </div>
                )}

                {m === "evidence" && (
                  <div style={{ marginBottom: ".75rem" }}>
                    <p className="text-muted" style={{ fontSize: ".82rem", marginBottom: ".35rem" }}>
                      رفض جزئي: اكتب سبباً بجانب الشاهد المراد رفضه فقط. أو سبب عام لرفض كل الشواهد.
                    </p>
                    <label className="label-field">سبب عام (كل الشواهد)</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      value={f.rejectReason}
                      onChange={(ev) =>
                        setForms((prev) => ({
                          ...prev,
                          [e.id]: { ...f, rejectReason: ev.target.value },
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      style={{ marginTop: ".5rem" }}
                      disabled={acting === e.id}
                      onClick={() => void run(e.id, "reject_evidence")}
                    >
                      تأكيد رفض الشواهد
                    </button>
                  </div>
                )}

                <ActionToolbar>
                  <IconActionButton
                    icon={CheckCircle2}
                    label="اعتماد نهائي"
                    variant="primary"
                    showLabel
                    disabled={acting === e.id}
                    onClick={() => void run(e.id, "final_approve")}
                  />
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    disabled={acting === e.id}
                    onClick={() => void run(e.id, "edit")}
                  >
                    حفظ التعديل فقط
                  </button>
                  <IconActionButton
                    icon={Ban}
                    label="رفض كامل"
                    variant="danger"
                    showLabel
                    onClick={() => toggleMode(e.id, "full")}
                  />
                  <IconActionButton
                    icon={PencilLine}
                    label="رفض صياغة"
                    showLabel
                    onClick={() => toggleMode(e.id, "wording")}
                  />
                  <IconActionButton
                    icon={FileWarning}
                    label="رفض شاهد"
                    variant="danger"
                    showLabel
                    onClick={() => toggleMode(e.id, "evidence")}
                  />
                </ActionToolbar>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
