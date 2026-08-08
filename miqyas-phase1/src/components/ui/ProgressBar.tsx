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
  const barColor =
    tone === "success"
      ? "var(--success-solid)"
      : tone === "warning"
        ? "var(--warning-solid)"
        : tone === "danger"
          ? "var(--danger-solid)"
          : "var(--action-primary-surface)";
  return (
    <div className="zad-progress">
      {label ? <div className="zad-progress__label">{label}</div> : null}
      <div
        className="zad-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label || `التقدّم ${pct}%`}
      >
        <span className="zad-progress__bar" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}
