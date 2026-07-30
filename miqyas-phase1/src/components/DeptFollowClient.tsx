"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, Save } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import ActionToolbar, { IconActionButton } from "@/components/ui/ActionToolbar";
import { APPROVAL_BADGE, type Period } from "@/lib/types";
import { displayApprovalLabel, isAwaitingDept } from "@/lib/approval-status";
import { notifyToast } from "@/lib/ui-toast";

type Row = {
  id: number;
  code: string;
  name: string;
  unit: string;
  ownerName: string;
  measurementPeriodId: number | null;
  actualValue: number | null;
  whatHappened: string | null;
  howHappened: string | null;
  approvalStatus: string | null;
  rejectReason?: string | null;
  evidenceCount: number;
};

export default function DeptFollowClient({
  year,
  period,
  rows: initialRows,
}: {
  year: number;
  period: Period;
  rows: Row[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ actual: "", what: "", how: "", comment: "" });
  const [acting, setActing] = useState(false);

  const pending = useMemo(
    () => rows.filter((r) => r.approvalStatus && isAwaitingDept(r.approvalStatus as never)),
    [rows]
  );

  function openEdit(row: Row) {
    setEditId(row.id);
    setForm({
      actual: row.actualValue?.toString() ?? "",
      what: row.whatHappened ?? "",
      how: row.howHappened ?? "",
      comment: "",
    });
  }

  async function act(row: Row, action: "update" | "initial_approve" | "return_edit") {
    if (!row.measurementPeriodId) {
      notifyToast.error("لا يوجد قياس مقدَّم بعد");
      return;
    }
    if (action === "return_edit" && form.comment.trim().length < 3) {
      notifyToast.error("سبب الإرجاع مطلوب");
      return;
    }
    setActing(true);
    const res = await fetch("/api/dept-follow", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        measurementPeriodId: row.measurementPeriodId,
        action,
        actualValue: form.actual ? parseFloat(form.actual) : undefined,
        whatHappened: form.what || null,
        howHappened: form.how || null,
        comment: form.comment || null,
      }),
    });
    setActing(false);
    if (res.ok) {
      notifyToast.success(
        action === "initial_approve"
          ? "تم الاعتماد المبدئي — بانتظار مشرف النظام"
          : action === "return_edit"
            ? "أُعيد للتعديل مع إشعار المدخل"
            : "تم حفظ التعديل",
        { duration: "short" }
      );
      setEditId(null);
      router.refresh();
      setRows((prev) =>
        prev.map((r) =>
          r.id !== row.id
            ? r
            : {
                ...r,
                actualValue: form.actual ? parseFloat(form.actual) : r.actualValue,
                whatHappened: form.what || r.whatHappened,
                howHappened: form.how || r.howHappened,
                approvalStatus:
                  action === "initial_approve"
                    ? "INITIAL_APPROVED"
                    : action === "return_edit"
                      ? "DRAFT"
                      : r.approvalStatus,
                rejectReason: action === "return_edit" ? form.comment : r.rejectReason,
              }
        )
      );
    } else {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشلت العملية");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مراجعة الإدارة</h1>
          <div className="text-muted">
            اعتماد مبدئي لمدير الإدارة فقط — الاعتماد النهائي لمشرف النظام
            {pending.length > 0 ? ` · ${pending.length} بانتظارك` : ""}
          </div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
        يمكنك تعديل «ماذا حصل / كيف حصل» ثم الاعتماد المبدئي، أو إرجاع القياس للمدخل مع سبب واضح.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {rows.length === 0 ? (
          <div className="card"><p className="text-muted">لا متطلبات لهذه الإدارة</p></div>
        ) : (
          rows.map((row) => {
            const status = row.approvalStatus;
            const label = displayApprovalLabel(status, row.rejectReason);
            return (
              <div key={row.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem", flexWrap: "wrap" }}>
                  <div>
                    <strong>{row.code}</strong> — {row.name}
                    <div className="text-muted" style={{ fontSize: ".82rem" }}>
                      المسؤول: {row.ownerName} · شواهد: {row.evidenceCount}
                      {row.actualValue != null ? ` · المتحقق: ${row.actualValue} ${row.unit}` : ""}
                    </div>
                  </div>
                  {status ? (
                    <span className={APPROVAL_BADGE[status] || "badge-neutral"}>{label}</span>
                  ) : (
                    <span className="badge-neutral">بدون إدخال</span>
                  )}
                </div>

                {(row.whatHappened || row.howHappened) && editId !== row.id && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: ".75rem", fontSize: ".85rem" }}>
                    <div><div className="label-field">ماذا حصل؟</div><p>{row.whatHappened || "—"}</p></div>
                    <div><div className="label-field">كيف حصل؟</div><p>{row.howHappened || "—"}</p></div>
                  </div>
                )}

                {editId === row.id ? (
                  <div style={{ marginTop: ".75rem", display: "grid", gap: ".65rem" }}>
                    <div>
                      <label className="label-field">المتحقق</label>
                      <input className="input-field" type="number" step="any" value={form.actual} onChange={(e) => setForm((f) => ({ ...f, actual: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label-field">ماذا حصل؟</label>
                      <textarea className="input-field" rows={3} value={form.what} onChange={(e) => setForm((f) => ({ ...f, what: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label-field">كيف حصل؟</label>
                      <textarea className="input-field" rows={3} value={form.how} onChange={(e) => setForm((f) => ({ ...f, how: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label-field">ملاحظة / سبب الإرجاع</label>
                      <input className="input-field" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="مطلوب عند الإرجاع" />
                    </div>
                    <ActionToolbar>
                      <IconActionButton icon={Save} label="حفظ التعديل" showLabel disabled={acting} onClick={() => void act(row, "update")} />
                      <IconActionButton icon={CheckCircle2} label="اعتماد مبدئي" variant="primary" showLabel disabled={acting} onClick={() => void act(row, "initial_approve")} />
                      <IconActionButton icon={RotateCcw} label="إرجاع للتعديل" variant="danger" showLabel disabled={acting} onClick={() => void act(row, "return_edit")} />
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setEditId(null)}>إلغاء</button>
                    </ActionToolbar>
                  </div>
                ) : (
                  row.measurementPeriodId &&
                  (status === "SUBMITTED" || status === "PENDING" || status === "INITIAL_APPROVED") && (
                    <div style={{ marginTop: ".75rem" }}>
                      <button type="button" className="btn-primary btn-sm" onClick={() => openEdit(row)}>
                        مراجعة / تعديل
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
