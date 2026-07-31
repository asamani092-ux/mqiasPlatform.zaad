"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Download, X } from "lucide-react";
import {
  allFieldsAccepted,
  anyRejected,
  emptyFieldDecisions,
  type Decision,
  type FieldDecisions,
  type FieldKey,
  FIELD_LABELS,
} from "@/lib/review-feedback";
import { ICON_PROPS } from "@/lib/icon-props";

export type ReviewEvidence = {
  id: number;
  fileName: string;
  mimeType?: string | null;
  status: string;
  rejectReason?: string | null;
};

export type ReviewWorkbenchItem = {
  measurementPeriodId: number;
  code: string;
  name: string;
  unit: string;
  departmentName?: string | null;
  ownerName?: string | null;
  enteredByName?: string | null;
  initialApproverName?: string | null;
  periodLabel?: string;
  requiredData?: string | null;
  kpiLabels?: string[];
  actualValue: number | null;
  whatHappened: string | null;
  howHappened: string | null;
  evidences: ReviewEvidence[];
};

type Props = {
  open: boolean;
  item: ReviewWorkbenchItem | null;
  approveLabel: string;
  returnLabel?: string;
  allowEditValues?: boolean;
  busy?: boolean;
  onClose: () => void;
  onApprove: (payload: {
    actualValue: number;
    whatHappened: string;
    howHappened: string;
    fieldDecisions: FieldDecisions;
    evidenceDecisions: Record<number, Decision>;
  }) => void;
  onReturn: (payload: {
    actualValue: number;
    whatHappened: string;
    howHappened: string;
    fieldDecisions: FieldDecisions;
    evidenceDecisions: Record<number, Decision>;
    notes: string;
  }) => void;
};

function DecisionButtons({
  value,
  onChange,
}: {
  value: Decision;
  onChange: (d: Exclude<Decision, null>) => void;
}) {
  return (
    <div className="review-decision-btns">
      <button
        type="button"
        className={`review-decision-btn accept ${value === "accept" ? "active" : ""}`}
        title="قبول"
        aria-label="قبول"
        onClick={() => onChange("accept")}
      >
        <Check {...ICON_PROPS} size={16} />
      </button>
      <button
        type="button"
        className={`review-decision-btn reject ${value === "reject" ? "active" : ""}`}
        title="رفض"
        aria-label="رفض"
        onClick={() => onChange("reject")}
      >
        <X {...ICON_PROPS} size={16} />
      </button>
    </div>
  );
}

function isPreviewable(mime?: string | null) {
  if (!mime) return false;
  return mime.startsWith("image/") || mime === "application/pdf";
}

export default function ReviewWorkbenchModal({
  open,
  item,
  approveLabel,
  returnLabel = "إعادة للتعديل",
  allowEditValues = true,
  busy = false,
  onClose,
  onApprove,
  onReturn,
}: Props) {
  const [actual, setActual] = useState("");
  const [what, setWhat] = useState("");
  const [how, setHow] = useState("");
  const [fields, setFields] = useState<FieldDecisions>(emptyFieldDecisions());
  const [evidenceDecisions, setEvidenceDecisions] = useState<Record<number, Decision>>({});
  const [notes, setNotes] = useState("");
  const [previewId, setPreviewId] = useState<number | null>(null);

  const activeEvidences = useMemo(
    () => (item?.evidences ?? []).filter((e) => e.status !== "REJECTED"),
    [item]
  );

  useEffect(() => {
    if (!item) return;
    setActual(item.actualValue != null ? String(item.actualValue) : "");
    setWhat(item.whatHappened ?? "");
    setHow(item.howHappened ?? "");
    setFields(emptyFieldDecisions());
    const ed: Record<number, Decision> = {};
    for (const e of item.evidences.filter((x) => x.status !== "REJECTED")) {
      ed[e.id] = null;
    }
    setEvidenceDecisions(ed);
    setNotes("");
    setPreviewId(item.evidences.find((e) => e.status !== "REJECTED")?.id ?? null);
  }, [item]);

  if (!open || !item) return null;

  const evidenceIds = activeEvidences.map((e) => e.id);
  const canApprove = allFieldsAccepted(fields, evidenceIds, evidenceDecisions);
  const hasReject = anyRejected(fields, evidenceDecisions);
  const canReturn = hasReject && notes.trim().length >= 3;

  function setField(key: FieldKey, d: Exclude<Decision, null>) {
    setFields((prev) => ({ ...prev, [key]: d }));
  }

  const preview = activeEvidences.find((e) => e.id === previewId) ?? activeEvidences[0];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="modal-panel wide review-workbench"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="review-workbench-head">
          <div>
            <h2>
              {item.code} — {item.name}
            </h2>
            <div className="review-workbench-meta text-muted">
              <span>الإدارة: {item.departmentName || "—"}</span>
              <span>المسؤول: {item.ownerName || "—"}</span>
              <span>أدخلها: {item.enteredByName || "—"}</span>
              {item.initialApproverName ? (
                <span>اعتماد مبدئي: {item.initialApproverName}</span>
              ) : null}
              {item.periodLabel ? <span>{item.periodLabel}</span> : null}
            </div>
            {item.kpiLabels && item.kpiLabels.length > 0 ? (
              <div className="text-muted" style={{ fontSize: ".8rem", marginTop: ".25rem" }}>
                مؤشرات: {item.kpiLabels.join(" · ")}
              </div>
            ) : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <X {...ICON_PROPS} />
          </button>
        </div>

        {item.requiredData ? (
          <div className="alert alert-info" style={{ marginBottom: ".75rem" }}>
            البيانات المطلوبة: {item.requiredData}
          </div>
        ) : null}

        <div className="review-field-block">
          <div className="review-field-title">
            <span>{FIELD_LABELS.actual} ({item.unit})</span>
            <DecisionButtons value={fields.actual} onChange={(d) => setField("actual", d)} />
          </div>
          {allowEditValues ? (
            <input
              className="input-field review-actual-input"
              type="number"
              step="any"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
            />
          ) : (
            <div className="review-value-box">{actual || "—"}</div>
          )}
        </div>

        <div className="review-narrative-grid">
          <div className="review-field-block">
            <div className="review-field-title">
              <span>{FIELD_LABELS.what}</span>
              <DecisionButtons value={fields.what} onChange={(d) => setField("what", d)} />
            </div>
            {allowEditValues ? (
              <textarea
                className="input-field"
                rows={4}
                value={what}
                onChange={(e) => setWhat(e.target.value)}
              />
            ) : (
              <div className="review-value-box">{what || "—"}</div>
            )}
          </div>
          <div className="review-field-block">
            <div className="review-field-title">
              <span>{FIELD_LABELS.how}</span>
              <DecisionButtons value={fields.how} onChange={(d) => setField("how", d)} />
            </div>
            {allowEditValues ? (
              <textarea
                className="input-field"
                rows={4}
                value={how}
                onChange={(e) => setHow(e.target.value)}
              />
            ) : (
              <div className="review-value-box">{how || "—"}</div>
            )}
          </div>
        </div>

        <div className="review-field-block">
          <div className="label-field" style={{ marginBottom: ".35rem" }}>
            الشواهد ({activeEvidences.length})
          </div>
          {activeEvidences.length === 0 ? (
            <p className="text-muted">لا شواهد نشطة</p>
          ) : (
            <>
              <div className="review-evidence-list">
                {activeEvidences.map((ev) => (
                  <div key={ev.id} className="review-evidence-row">
                    <button
                      type="button"
                      className={`badge-primary review-evidence-name ${previewId === ev.id ? "active" : ""}`}
                      onClick={() => setPreviewId(ev.id)}
                    >
                      {ev.fileName}
                    </button>
                    <DecisionButtons
                      value={evidenceDecisions[ev.id] ?? null}
                      onChange={(d) =>
                        setEvidenceDecisions((prev) => ({ ...prev, [ev.id]: d }))
                      }
                    />
                  </div>
                ))}
              </div>
              {preview && (
                <div className="review-evidence-preview">
                  <div className="review-evidence-preview-bar">
                    <span className="text-muted">{preview.fileName}</span>
                    <a
                      className="btn-secondary btn-sm"
                      href={`/api/evidence/${preview.id}`}
                      download
                    >
                      <Download {...ICON_PROPS} size={14} /> تنزيل
                    </a>
                  </div>
                  {isPreviewable(preview.mimeType) ? (
                    preview.mimeType?.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/evidence/${preview.id}?inline=1`}
                        alt={preview.fileName}
                        className="review-evidence-img"
                      />
                    ) : (
                      <iframe
                        title={preview.fileName}
                        src={`/api/evidence/${preview.id}?inline=1`}
                        className="review-evidence-iframe"
                      />
                    )
                  ) : (
                    <p className="text-muted">لا يمكن الاستعراض لهذا النوع — استخدم التنزيل.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {hasReject && (
          <div className="review-notes-block">
            <label className="label-field">ملاحظات الإعادة للتعديل (مطلوبة)</label>
            <textarea
              className="input-field"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اشرح ما يجب تصحيحه للمدخل..."
            />
          </div>
        )}

        <div className="review-workbench-actions">
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !canApprove || !actual}
            title={!canApprove ? "يجب قبول كل الحقول والشواهد أولاً" : undefined}
            onClick={() =>
              onApprove({
                actualValue: parseFloat(actual),
                whatHappened: what,
                howHappened: how,
                fieldDecisions: fields,
                evidenceDecisions,
              })
            }
          >
            {approveLabel}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy || !canReturn}
            title={
              !hasReject
                ? "ارفض حقلاً أو شاهداً أولاً"
                : notes.trim().length < 3
                  ? "أضف ملاحظات (3 أحرف على الأقل)"
                  : undefined
            }
            onClick={() =>
              onReturn({
                actualValue: parseFloat(actual || "0"),
                whatHappened: what,
                howHappened: how,
                fieldDecisions: fields,
                evidenceDecisions,
                notes: notes.trim(),
              })
            }
          >
            {returnLabel}
          </button>
          <button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
