"use client";

import type { ReactNode } from "react";
import EmptyState from "@/components/ui/EmptyState";

export type ReviewCardModel = {
  id: number;
  code: string;
  name: string;
  departmentName?: string | null;
  ownerName?: string | null;
  enteredByName?: string | null;
  statusLabel: string;
  statusClass?: string;
  evidenceCount: number;
  meta?: string;
  /** مقتطف ملاحظات القسم / المشرف */
  notesSnippet?: string | null;
};

export default function ReviewQueueCards({
  items,
  emptyText = "لا عناصر في الطابور",
  onOpen,
  trailing,
}: {
  items: ReviewCardModel[];
  emptyText?: string;
  onOpen: (id: number) => void;
  trailing?: (id: number) => ReactNode;
}) {
  if (items.length === 0) {
    return <EmptyState title="لا عناصر" body={emptyText} />;
  }

  return (
    <div className="review-queue">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="review-queue-card card"
          onClick={() => onOpen(item.id)}
        >
          <div className="review-queue-card-head">
            <div>
              <strong>
                {item.code}
              </strong>
              {" — "}
              {item.name}
            </div>
            <span className={item.statusClass || "badge-neutral"}>{item.statusLabel}</span>
          </div>
          <div className="review-queue-card-meta text-muted">
            {item.departmentName ? <span>الإدارة: {item.departmentName}</span> : null}
            <span>المسؤول: {item.ownerName?.trim() ? item.ownerName : "بلا مسؤول"}</span>
            {item.enteredByName ? <span>أدخلها: {item.enteredByName}</span> : null}
            <span>شواهد: {item.evidenceCount}</span>
            {item.meta ? <span>{item.meta}</span> : null}
          </div>
          {item.notesSnippet ? (
            <div className="review-queue-card-notes alert alert-warn" style={{ marginTop: ".5rem", textAlign: "start" }}>
              <strong>ملاحظات القسم / المشرف:</strong> {item.notesSnippet}
            </div>
          ) : null}
          {trailing ? <div className="review-queue-card-trail">{trailing(item.id)}</div> : null}
        </button>
      ))}
    </div>
  );
}
