"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CircleHelp, X } from "lucide-react";
import { ICON_PROPS } from "@/lib/icon-props";

export type TrackHelpContent = {
  title: string;
  body: string;
  bullets: string[];
};

/** زر شرح المسار + نافذة منبثقة موحّدة */
export default function TrackHelpButton({ content }: { content: TrackHelpContent }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="btn-secondary btn-sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <CircleHelp {...ICON_PROPS} />
        شرح المسار
      </button>
      {open && (
        <div className="modal-overlay" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={content.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{content.title}</h2>
              <button type="button" className="icon-btn icon-btn--sm" aria-label="إغلاق" onClick={() => setOpen(false)}>
                <X {...ICON_PROPS} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginTop: 0, lineHeight: 1.7 }}>{content.body}</p>
              <ul className="track-help-list">
                {content.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-primary btn-sm" onClick={() => setOpen(false)}>
                حسناً
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function TrackTitleRow({
  title,
  subtitle,
  help,
  extra,
}: {
  title: string;
  subtitle?: string;
  help?: TrackHelpContent;
  extra?: ReactNode;
}) {
  return (
    <div className="topbar">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>{title}</h1>
          {help ? <TrackHelpButton content={help} /> : null}
        </div>
        {subtitle ? <div className="text-muted">{subtitle}</div> : null}
      </div>
      {extra}
    </div>
  );
}
