"use client";

import Link from "next/link";

export type Crumb = { label: string; href?: string };

/** مسار تنقّل — عقد Breadcrumb */
export default function PageBreadcrumb({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav className="zad-breadcrumb" aria-label="breadcrumb">
      <ol>
        {items.map((item, idx) => {
          const last = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`}>
              {idx > 0 ? (
                <span className="zad-breadcrumb__sep" aria-hidden="true">
                  ‹
                </span>
              ) : null}
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined}>{item.label}</span>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
