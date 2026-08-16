"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ICON_PROPS } from "@/lib/icon-props";

/** حوار تأكيد — عقد Dialog/Confirm · خصائص اختيارية إضافية لا تكسر الاستدعاءات الحالية */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "متابعة",
  cancelLabel = "إلغاء",
  destructive = false,
  busy = false,
  confirmPhrase,
  phraseHint,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  /** إن وُجد: تأكيد ثنائي بكتابة العبارة حرفيًا */
  confirmPhrase?: string;
  phraseHint?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open, confirmPhrase]);

  if (!open) return null;

  const phraseOk = !confirmPhrase || typed.trim() === confirmPhrase;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zad-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="zad-drawer-header" style={{ marginBlockEnd: "var(--space-3)" }}>
          <h2 id="zad-confirm-title" className="zad-drawer-title">
            {title}
          </h2>
          <button type="button" className="icon-btn zad-drawer-close" onClick={onClose} aria-label="إغلاق">
            <X {...ICON_PROPS} />
          </button>
        </div>
        <p className="text-muted" style={{ whiteSpace: "pre-wrap" }}>
          {body}
        </p>
        {confirmPhrase ? (
          <div style={{ marginBlockStart: "var(--space-3)" }}>
            <label className="label-field" htmlFor="zad-confirm-phrase">
              {phraseHint || `اكتب «${confirmPhrase}» للمتابعة`}
            </label>
            <input
              id="zad-confirm-phrase"
              className="input-field"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={busy}
            />
          </div>
        ) : null}
        <div className="zad-confirm-actions">
          <button
            type="button"
            className={destructive ? "btn-danger" : "btn-primary"}
            disabled={busy || !phraseOk}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
