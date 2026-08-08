"use client";

import { X } from "lucide-react";
import { ICON_PROPS } from "@/lib/icon-props";

/** حوار تأكيد — عقد Dialog/Confirm · لا يغيّر واجهات الاستدعاء الخارجية */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "متابعة",
  cancelLabel = "إلغاء",
  destructive = false,
  busy = false,
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
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
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
        <div className="zad-confirm-actions">
          <button
            type="button"
            className={destructive ? "btn-danger" : "btn-primary"}
            disabled={busy}
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
