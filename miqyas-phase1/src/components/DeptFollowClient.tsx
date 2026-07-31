"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PeriodSelector from "@/components/PeriodSelector";
import ReviewSmartSearch from "@/components/ui/ReviewSmartSearch";
import ReviewQueueCards from "@/components/ui/ReviewQueueCards";
import ReviewWorkbenchModal, {
  type ReviewWorkbenchItem,
} from "@/components/ui/ReviewWorkbenchModal";
import { APPROVAL_BADGE, type Period } from "@/lib/types";
import { displayApprovalLabel, isAwaitingDept } from "@/lib/approval-status";
import { notifyToast } from "@/lib/ui-toast";
import type { Decision, FieldDecisions } from "@/lib/review-feedback";

type Evidence = {
  id: number;
  fileName: string;
  mimeType?: string | null;
  status: string;
  rejectReason?: string | null;
};

type Row = {
  id: number;
  code: string;
  name: string;
  unit: string;
  requiredData?: string | null;
  ownerName: string;
  departmentName: string;
  kpiCodes: string[];
  kpiLabels: string[];
  measurementPeriodId: number | null;
  actualValue: number | null;
  whatHappened: string | null;
  howHappened: string | null;
  approvalStatus: string | null;
  rejectReason?: string | null;
  enteredByName?: string | null;
  evidences: Evidence[];
  evidenceCount: number;
};

function evidencePayload(map: Record<number, Decision>) {
  return Object.entries(map)
    .filter(([, d]) => d === "accept" || d === "reject")
    .map(([evidenceId, decision]) => ({
      evidenceId: parseInt(evidenceId, 10),
      decision: decision as "accept" | "reject",
    }));
}

export default function DeptFollowClient({
  year,
  period,
  rows: initialRows,
}: {
  year: number;
  period: Period;
  rows: Row[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [openReqId, setOpenReqId] = useState<number | null>(null);
  const [acting, setActing] = useState(false);

  const pendingCount = useMemo(
    () => rows.filter((r) => r.approvalStatus && isAwaitingDept(r.approvalStatus as never)).length,
    [rows]
  );

  const cards = useMemo(
    () =>
      rows
        .filter((r) => r.measurementPeriodId)
        .map((r) => {
          const awaiting = !!(r.approvalStatus && isAwaitingDept(r.approvalStatus as never));
          return {
            ...r,
            departmentName: r.departmentName,
            ownerName: r.ownerName,
            enteredByName: r.enteredByName ?? null,
            statusLabel: displayApprovalLabel(r.approvalStatus, r.rejectReason),
            kpiCodes: r.kpiCodes,
            evidenceCount: r.evidenceCount,
            awaiting,
          };
        }),
    [rows]
  );

  const openRow = rows.find((r) => r.id === openReqId) ?? null;
  const canReview =
    !!openRow?.measurementPeriodId &&
    !!openRow.approvalStatus &&
    (openRow.approvalStatus === "SUBMITTED" || openRow.approvalStatus === "PENDING");

  const workbenchItem: ReviewWorkbenchItem | null =
    openRow && openRow.measurementPeriodId && canReview
      ? {
          measurementPeriodId: openRow.measurementPeriodId,
          code: openRow.code,
          name: openRow.name,
          unit: openRow.unit,
          departmentName: openRow.departmentName,
          ownerName: openRow.ownerName,
          enteredByName: openRow.enteredByName,
          requiredData: openRow.requiredData,
          kpiLabels: openRow.kpiLabels,
          actualValue: openRow.actualValue,
          whatHappened: openRow.whatHappened,
          howHappened: openRow.howHappened,
          evidences: openRow.evidences,
        }
      : null;

  async function submit(
    action: "initial_approve" | "return_edit",
    payload: {
      actualValue: number;
      whatHappened: string;
      howHappened: string;
      fieldDecisions: FieldDecisions;
      evidenceDecisions: Record<number, Decision>;
      notes?: string;
    }
  ) {
    if (!openRow?.measurementPeriodId) {
      notifyToast.error("لا يوجد قياس مقدَّم بعد");
      return;
    }
    if (action === "initial_approve" && openRow.approvalStatus === "INITIAL_APPROVED") {
      notifyToast.error("القياس معتمد مبدئياً مسبقاً");
      return;
    }

    setActing(true);
    const res = await fetch("/api/dept-follow", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        measurementPeriodId: openRow.measurementPeriodId,
        action,
        actualValue: payload.actualValue,
        whatHappened: payload.whatHappened || null,
        howHappened: payload.howHappened || null,
        fieldDecisions: payload.fieldDecisions,
        evidenceDecisions: evidencePayload(payload.evidenceDecisions),
        notes: payload.notes,
        comment: payload.notes,
      }),
    });
    setActing(false);
    if (res.ok) {
      notifyToast.success(
        action === "initial_approve"
          ? "تم الاعتماد المبدئي — بانتظار مشرف النظام"
          : "أُعيد للتعديل مع إشعار المدخل",
        { duration: "short" }
      );
      setOpenReqId(null);
      router.refresh();
      setRows((prev) =>
        prev.map((r) =>
          r.id !== openRow.id
            ? r
            : {
                ...r,
                actualValue: payload.actualValue,
                whatHappened: payload.whatHappened,
                howHappened: payload.howHappened,
                approvalStatus: action === "initial_approve" ? "INITIAL_APPROVED" : "DRAFT",
                rejectReason: action === "return_edit" ? payload.notes ?? r.rejectReason : null,
              }
        )
      );
    } else {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشلت العملية");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مراجعة الإدارة</h1>
          <div className="text-muted">
            اعتماد مبدئي لمدير الإدارة
            {pendingCount > 0 ? ` · ${pendingCount} بانتظارك` : ""}
          </div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
        نفس نافذة المراجعة كمشرف النظام: قبول/رفض لكل حقل وشاهد، ثم اعتماد مبدئي أو إعادة للتعديل.
      </div>

      <ReviewSmartSearch items={cards} showAwaitingChip>
        {(filtered) => (
          <ReviewQueueCards
            items={filtered.map((c) => ({
              id: c.id,
              code: c.code,
              name: c.name,
              departmentName: c.departmentName,
              ownerName: c.ownerName,
              enteredByName: c.enteredByName,
              statusLabel: c.statusLabel,
              statusClass: c.approvalStatus
                ? APPROVAL_BADGE[c.approvalStatus] || "badge-neutral"
                : "badge-neutral",
              evidenceCount: c.evidenceCount,
              meta: c.awaiting ? "بانتظارك" : undefined,
            }))}
            emptyText="لا قياسات في هذه الفترة ضمن نطاق إدارتك."
            onOpen={(id) => {
              const row = rows.find((r) => r.id === id);
              if (!row?.measurementPeriodId) {
                notifyToast.error("لا يوجد قياس مقدَّم بعد");
                return;
              }
              if (
                !row.approvalStatus ||
                (row.approvalStatus !== "SUBMITTED" && row.approvalStatus !== "PENDING")
              ) {
                notifyToast.error(
                  row.approvalStatus === "INITIAL_APPROVED"
                    ? "معتمد مبدئياً — بانتظار مشرف النظام"
                    : "هذا القياس ليس بانتظار مراجعتك"
                );
                return;
              }
              setOpenReqId(id);
            }}
          />
        )}
      </ReviewSmartSearch>

      <ReviewWorkbenchModal
        open={!!workbenchItem && canReview}
        item={workbenchItem}
        approveLabel="اعتماد مبدئي"
        returnLabel="إعادة للتعديل"
        busy={acting}
        onClose={() => setOpenReqId(null)}
        onApprove={(p) => void submit("initial_approve", p)}
        onReturn={(p) => void submit("return_edit", p)}
      />
    </>
  );
}
