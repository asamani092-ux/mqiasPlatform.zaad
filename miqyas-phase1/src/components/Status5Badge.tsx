import { STATUS5_BADGE, STATUS5_LABEL, type Status5 } from "@/lib/status5";

export function Status5Badge({ status }: { status: Status5 }) {
  return <span className={STATUS5_BADGE[status]}>{STATUS5_LABEL[status]}</span>;
}

export function Status5OwnerLine({
  status,
  ownerLabel,
  departmentName,
}: {
  status: Status5;
  ownerLabel: string | null;
  departmentName: string | null;
}) {
  const owner = departmentName || ownerLabel || "—";
  return (
    <div className="status-owner-line">
      <Status5Badge status={status} />
      <span className="text-muted">
        — الإدارة المالكة: {owner}
      </span>
    </div>
  );
}
