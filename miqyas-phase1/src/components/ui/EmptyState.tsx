"use client";

import type { ReactNode } from "react";

/** حالة فراغ — عقد EmptyState */
export default function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="zad-empty" role="status">
      {icon ? <div aria-hidden="true">{icon}</div> : null}
      <h3 className="zad-empty-title">{title}</h3>
      {body ? <p className="zad-empty-body">{body}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
