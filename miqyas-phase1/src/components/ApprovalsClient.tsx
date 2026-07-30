"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileWarning, PencilLine } from "lucide-react";
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

export default function ApprovalsClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [mode, setMode] = useState<Record<number, "approve" | "wording" | "evidence" | null>>({});
  const [forms, setForms] = useState<
    Record<
      number,
      {
        what: string;
        how: string;
        actual: string;
        rejectReason: string;
        suggestedWording: string;
        evidenceReasons: Record<number, string>;
      }
    >
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/approvals");
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
      const next: typeof forms = {};
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

  async function run(id: number, action: "final_approve" | "reject_wording" | "reject_evidence" | "edit") {
    const f = forms[id];
    const entry = entries.find((e) => e.id === id);
    if (!f || !entry) return;

    if (action === "reject_wording" && f.rejectReason.trim().length < 3) {
      notifyToast.error("سبب رفض الصياغة مطلوب");
      return;
    }
    if (action === "reject_evidence") {
      const selected = Object.entries(f.evidenceReasons).filter(([, r]) => r.trim().length >= 3);
      if (selected.length === 0 && f.rejectReason.trim().length < 3) {
        notifyToast.error("حدّد شاهداً مرفوضاً بسبب، أو سبب عام");
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
    if (action === "reject_wording") {
      body.rejectReason = f.rejectReason.trim();
      body.suggestedWording = f.suggestedWording || null;
    }
    if (action === "reject_evidence") {
      const evidenceRejections = Object.entries(f.evidenceReasons)
        .filter(([, reason]) => reason.trim().length >= 3)
        .map(([evidenceId, reason]) => ({ evidenceId: parseInt(evidenceId, 10), reason: reason.trim() }));
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
      notifyToast.success(
        action === "final_approve"
          ? "تم الاعتماد النهائي"
          : action === "reject_wording"
            ? "رُفضت الصياغة وأُعيد للمدخل"
            : action === "reject_evidence"
              ? "رُفضت الشواهد وأُعيد للمدخل"
              : "تم حفظ التعديل",
        { duration: "short" }
      );
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
          <div className="text-muted">قائمة المعتمد مبدئياً فقط — مشرف النظام</div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
        <strong>الصلاحيات:</strong> الإدخال عبر «شواهد المؤشرات» · الاعتماد المبدئي لمدير الإدارة ·
        الاعتماد النهائي ورفض الصياغة/الشواهد لمشرف النظام فقط.
      </div>

      {loading ? (
        <p className="text-muted">جاري التحميل...</p>
      ) : entries.length === 0 ? (
        <div className="card"><p className="text-muted">لا توجد قياسات بانتظار الاعتماد النهائي.</p></div>
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
            return (
              <div key={e.id} className="card">
                <div style={{ marginBottom: ".65rem" }}>
                  <strong style={{ fontSize: "1.05rem" }}>{e.requirement.code}</strong>
                  {" — "}
                  {e.requirement.name}
                  <div className="text-muted" style={{ fontSize: ".82rem", marginTop: ".25rem" }}>
                    {e.requirement.department?.name || "—"} · دور التعبئة:{" "}
                    {FILLER_ROLE_LABEL[e.requirement.fillerRole] || e.requirement.fillerRole}
                    {" · "}أدخلها: {e.employee.name}
                    {e.initialApprovedBy ? ` · اعتماد مبدئي: ${e.initialApprovedBy.name}` : ""}
                    {" · "}
                    {PERIOD_LABEL[e.period as Period] || e.period} {e.year}
                  </div>
                </div>

                {e.requirement.kpis.length > 0 && (
                  <div style={{ marginBottom: ".65rem", fontSize: ".82rem" }}>
                    <span className="text-muted">المؤشرات المرتبطة: </span>
                    {e.requirement.kpis
                      .map((k) => `${k.code} — ${k.name} (${KPI_TYPE[k.type as keyof typeof KPI_TYPE] ?? k.type})`)
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
                  <div className="label-field">الشواهد</div>
                  {e.evidences.length === 0 ? (
                    <span className="text-muted">لا شواهد</span>
                  ) : (
                    e.evidences.map((ev) => (
                      <div key={ev.id} style={{ display: "flex", gap: ".5rem", alignItems: "center", marginBottom: ".35rem", flexWrap: "wrap" }}>
                        <a href={`/api/evidence/${ev.id}`} className="badge-primary">
                          {ev.fileName}
                        </a>
                        {m === "evidence" && (
                          <input
                            className="input-field"
                            style={{ maxWidth: 280 }}
                            placeholder="سبب رفض هذا الشاهد"
                            value={f.evidenceReasons[ev.id] ?? ""}
                            onChange={(x) =>
                              setForms((prev) => ({
                                ...prev,
                                [e.id]: {
                                  ...f,
                                  evidenceReasons: { ...f.evidenceReasons, [ev.id]: x.target.value },
                                },
                              }))
                            }
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {m === "wording" && (
                  <div style={{ marginBottom: ".75rem", display: "grid", gap: ".5rem" }}>
                    <div>
                      <label className="label-field">سبب رفض الصياغة</label>
                      <textarea
                        className="input-field"
                        rows={2}
                        value={f.rejectReason}
                        onChange={(ev) =>
                          setForms((prev) => ({ ...prev, [e.id]: { ...f, rejectReason: ev.target.value } }))
                        }
                      />
                    </div>
                    <div>
                      <label className="label-field">الصياغة المقترحة</label>
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
                      onClick={() => void run(e.id, "reject_wording")}
                    >
                      تأكيد رفض الصياغة
                    </button>
                  </div>
                )}

                {m === "evidence" && (
                  <div style={{ marginBottom: ".75rem" }}>
                    <label className="label-field">سبب عام (إن لم تحدد شاهداً)</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      value={f.rejectReason}
                      onChange={(ev) =>
                        setForms((prev) => ({ ...prev, [e.id]: { ...f, rejectReason: ev.target.value } }))
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
                  <IconActionButton
                    icon={PencilLine}
                    label="رفض صياغة"
                    showLabel
                    onClick={() => setMode((prev) => ({ ...prev, [e.id]: m === "wording" ? null : "wording" }))}
                  />
                  <IconActionButton
                    icon={FileWarning}
                    label="رفض شواهد"
                    variant="danger"
                    showLabel
                    onClick={() => setMode((prev) => ({ ...prev, [e.id]: m === "evidence" ? null : "evidence" }))}
                  />
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    disabled={acting === e.id}
                    onClick={() => void run(e.id, "edit")}
                  >
                    حفظ التعديل فقط
                  </button>
                </ActionToolbar>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
