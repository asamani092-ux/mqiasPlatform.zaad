"use client";

/** وسم/شريحة — عقد Badge/Tag */
export default function Chip({
  label,
  tone = "neutral",
  onRemove,
}: {
  label: string;
  tone?: "neutral" | "brand";
  onRemove?: () => void;
}) {
  return (
    <span className={`zad-chip ${tone === "brand" ? "zad-chip--brand" : ""} ${onRemove ? "zad-chip--removable" : ""}`.trim()}>
      {onRemove ? (
        <button
          type="button"
          className="zad-chip-remove"
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
