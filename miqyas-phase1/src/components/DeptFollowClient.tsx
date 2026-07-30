"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PeriodSelector from "@/components/PeriodSelector";
import { APPROVAL_BADGE, APPROVAL_LABEL, type Period } from "@/lib/types";

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
    () => rows.filter((r) => r.approvalStatus === "SUBMITTED" || r.approvalStatus === "PENDING"),
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
      toast.error("لا يوجد قياس مقدَّم بعد");
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
      toast.success(
        action === "initial_approve"
          ? "تم الاعتماد المبدئي"
          : action === "return_edit"
            ? "أُعيد للتعديل"
            : "تم حفظ التعديل"
      );
      setEditId(null);
      router.refresh();
      // تحديث محلي سريع
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
              }
        )
      );
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "فشلت العملية");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مراجعة الإدارة</h1>
          <div className="text-muted">
            اطّلع على شواهد إدارتك وعدّل «ماذا حصل / كيف حصل» ثم اعتمد مبدئياً
            {pending.length > 0 ? ` · ${pending.length} بانتظارك` : ""}
          </div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {rows.length === 0 ? (
          <div className="card"><p className="text-muted">لا متطلبات لهذه الإدارة</p></div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem", flexWrap: "wrap" }}>
                <div>
                  <strong>{row.code}</strong> — {row.name}
                  <div className="text-muted" style={{ fontSize: ".82rem" }}>
                    المسؤول: {row.ownerName} · شواهد: {row.evidenceCount}
                    {row.actualValue != null ? ` · المتحقق: ${row.actualValue} ${row.unit}` : ""}
                  </div>
                </div>
                {row.approvalStatus ? (
                  <span className={APPROVAL_BADGE[row.approvalStatus]}>
                    {APPROVAL_LABEL[row.approvalStatus]}
                  </span>
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
                    <label className="label-field">ملاحظة (اختياري)</label>
                    <input className="input-field" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                    <button type="button" className="btn-secondary btn-sm" disabled={acting} onClick={() => void act(row, "update")}>حفظ التعديل</button>
                    <button type="button" className="btn-primary btn-sm" disabled={acting} onClick={() => void act(row, "initial_approve")}>اعتماد مبدئي</button>
                    <button type="button" className="btn-secondary btn-sm" disabled={acting} onClick={() => void act(row, "return_edit")}>إرجاع للتعديل</button>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => setEditId(null)}>إلغاء</button>
                  </div>
                </div>
              ) : (
                row.measurementPeriodId &&
                (row.approvalStatus === "SUBMITTED" ||
                  row.approvalStatus === "PENDING" ||
                  row.approvalStatus === "INITIAL_APPROVED") && (
                  <div style={{ marginTop: ".75rem" }}>
                    <button type="button" className="btn-primary btn-sm" onClick={() => openEdit(row)}>
                      مراجعة / تعديل
                    </button>
                  </div>
                )
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
