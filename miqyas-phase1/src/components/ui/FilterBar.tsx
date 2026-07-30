"use client";

import type { ReactNode } from "react";

/** شريط فلاتر موحّد — صف واحد قابل للالتفاف */
export default function FilterBar({
  children,
  actions,
  className = "",
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`filter-bar card ${className}`.trim()}>
      <div className="filter-bar-fields">{children}</div>
      {actions ? <div className="filter-bar-actions">{actions}</div> : null}
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
