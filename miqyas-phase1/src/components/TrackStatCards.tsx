import { STATUS_LABEL, STATUS_BADGE, type KpiStatus } from "@/lib/types";

const ACCENT: Partial<Record<KpiStatus, string>> = {
  ACHIEVED: "stat-card--success",
  ON_TRACK: "",
  AT_RISK: "stat-card--warning",
  CRITICAL: "stat-card--danger",
};

export default function TrackStatCards({ counts }: { counts: Record<KpiStatus, number> }) {
  const items: KpiStatus[] = ["ACHIEVED", "ON_TRACK", "AT_RISK", "CRITICAL"];

  return (
    <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
      {items.map((key) => (
        <div key={key} className={`card stat-card ${ACCENT[key] ?? ""}`.trim()}>
          <div className="stat-num">{counts[key]}</div>
          <div className="stat-lbl">{STATUS_LABEL[key]}</div>
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: KpiStatus }) {
  return <span className={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</span>;
}
