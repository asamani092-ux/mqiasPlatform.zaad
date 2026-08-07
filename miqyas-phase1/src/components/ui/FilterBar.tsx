"use client";

import type { ReactNode } from "react";
import Chip from "@/components/ui/Chip";

/** شريط فلاتر موحّد — عقد FilterBar + وسوم مطبّقة */
export default function FilterBar({
  children,
  actions,
  applied,
  onClear,
  className = "",
}: {
  children: ReactNode;
  actions?: ReactNode;
  applied?: { id: string; label: string; onRemove?: () => void }[];
  onClear?: () => void;
  className?: string;
}) {
  return (
    <div className={`filter-bar card ${className}`.trim()}>
      <div className="filter-bar-fields">{children}</div>
      {actions ? <div className="filter-bar-actions">{actions}</div> : null}
      {applied && applied.length > 0 ? (
        <div className="filter-bar-chips" aria-live="polite">
          {applied.map((chip) => (
            <Chip key={chip.id} label={chip.label} tone="brand" onRemove={chip.onRemove} />
          ))}
          {onClear ? (
            <button type="button" className="btn-secondary btn-sm" onClick={onClear}>
              مسح الكل
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="filter-field">
      <label className="label-field">{label}</label>
      {children}
    </div>
  );
}
