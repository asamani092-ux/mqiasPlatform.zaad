"use client";

/** هيكل تحميل — عقد Spinner/Skeleton */
export default function Skeleton({
  lines = 3,
  variant = "line",
}: {
  lines?: number;
  variant?: "line" | "card";
}) {
  if (variant === "card") {
    return (
      <div role="status" aria-live="polite" aria-label="جارٍ التحميل">
        <span className="zad-skeleton zad-skeleton--card" />
        <span className="sr-only">جارٍ التحميل</span>
      </div>
    );
  }
  return (
    <div role="status" aria-live="polite" aria-label="جارٍ التحميل">
      {Array.from({ length: lines }).map((_, i) => (
        <span key={i} className="zad-skeleton zad-skeleton--line" style={{ width: `${90 - i * 10}%` }} />
      ))}
      <span className="sr-only">جارٍ التحميل</span>
    </div>
  );
}
