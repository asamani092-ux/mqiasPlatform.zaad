"use client";

/** شريط تقدّم — عقد Progress */
export default function ProgressBar({
  value,
  label,
  tone = "brand",
}: {
  value: number;
  label?: string;
  tone?: "brand" | "success" | "warning" | "danger";
}) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const toneClass =
    tone === "success"
      ? "zad-progress-bar--success"
      : tone === "warning"
        ? "zad-progress-bar--warning"
        : tone === "danger"
          ? "zad-progress-bar--danger"
          : "";
  return (
    <div>
      {label ? (
        <div className="text-muted" style={{ fontSize: "var(--text-xs)", marginBlockEnd: "var(--space-1)" }}>
          {label}
        </div>
      ) : null}
      <div
        className="zad-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label || `التقدّم ${pct}%`}
      >
        <div className={`zad-progress-bar ${toneClass}`.trim()} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
