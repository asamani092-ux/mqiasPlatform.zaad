import { STATUS_LABEL, STATUS_BADGE, type KpiStatus } from "@/lib/types";

export default function TrackStatCards({ counts }: { counts: Record<KpiStatus, number> }) {
  const items: { key: KpiStatus; color: string }[] = [
    { key: "ACHIEVED", color: "var(--tmkeen-success)" },
    { key: "ON_TRACK", color: "var(--tmkeen-warning)" },
    { key: "AT_RISK", color: "var(--tmkeen-warning)" },
    { key: "CRITICAL", color: "var(--tmkeen-danger)" },
  ];

  return (
    <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
      {items.map(({ key, color }) => (
        <div key={key} className="card stat-card" style={{ borderRightColor: color }}>
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
