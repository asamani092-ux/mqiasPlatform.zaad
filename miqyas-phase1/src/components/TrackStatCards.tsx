import { STATUS_LABEL, STATUS_BADGE, type KpiStatus } from "@/lib/types";

export default function TrackStatCards({ counts }: { counts: Record<KpiStatus, number> }) {
  const items: { key: KpiStatus; color: string }[] = [
    { key: "ACHIEVED", color: "var(--green)" },
    { key: "ON_TRACK", color: "var(--amber)" },
    { key: "AT_RISK", color: "var(--orange)" },
    { key: "CRITICAL", color: "var(--red)" },
  ];

  return (
    <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
      {items.map(({ key, color }) => (
        <div key={key} className="card stat" style={{ borderRightColor: color }}>
          <div className="num">{counts[key]}</div>
          <div className="lbl">{STATUS_LABEL[key]}</div>
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: KpiStatus }) {
  return <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>;
}
