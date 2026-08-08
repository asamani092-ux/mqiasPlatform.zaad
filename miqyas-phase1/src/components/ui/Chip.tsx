"use client";

/** وسم/شريحة — عقد Badge/Tag */
export default function Chip({
  label,
  tone = "neutral",
  onRemove,
}: {
  label: string;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
  onRemove?: () => void;
}) {
  const toneClass =
    tone === "brand"
      ? ""
      : tone === "success"
        ? "zad-chip--success"
        : tone === "warning"
          ? "zad-chip--warning"
          : tone === "danger"
            ? "zad-chip--danger"
            : "zad-chip--neutral";
  return (
    <span className={`zad-chip ${toneClass}`.trim()}>
      {onRemove ? (
        <button
          type="button"
          className="zad-chip__remove"
          aria-label={`إزالة ${label}`}
          onClick={onRemove}
        >
          ×
        </button>
      ) : null}
      {label}
    </span>
  );
}
