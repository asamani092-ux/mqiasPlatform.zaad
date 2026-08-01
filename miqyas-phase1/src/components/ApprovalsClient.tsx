"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import { TYPE_LABEL as KPI_TYPE } from "@/lib/kpi-schemas";
import { displayApprovalLabel } from "@/lib/approval-status";
import { notifyToast } from "@/lib/ui-toast";
import ReviewSmartSearch from "@/components/ui/ReviewSmartSearch";
import ReviewQueueCards from "@/components/ui/ReviewQueueCards";
import ReviewWorkbenchModal, {
  type ReviewWorkbenchItem,
} from "@/components/ui/ReviewWorkbenchModal";
import type { Decision, FieldDecisions } from "@/lib/review-feedback";
import { notesCardSnippet } from "@/lib/review-feedback";

type Entry = {
  id: number;
  measurementPeriodId: number;
  year: number;
  period: string;
  actualValue: number;
  whatHappened: string | null;
  howHappened: string | null;
  approvalStatus?: string;
  rejectReason?: string | null;
  reviewFeedback?: unknown;
  requirement: {
    code: string;
    name: string;
    unit: string;
    requiredData: string | null;
    owner: { id: number; name: string; email: string } | null;
    department: { name: string } | null;
    kpis: { id: number; code: string; name: string; type: string }[];
  };
  employee: { id: number; name: string; email: string; role?: string };
  initialApprovedBy: { id: number; name: string } | null;
  evidences: {
    id: number;
    fileName: string;
    mimeType?: string | null;
    status: string;
    rejectReason: string | null;
  }[];
};

type QueueMode = "pending" | "final";

type CardItem = Entry & {
  code: string;
  name: string;
  departmentName: string | null;
  ownerName: string | null;
  enteredByName: string;
  statusLabel: string;
  kpiCodes: string[];
  evidenceCount: number;
  awaiting: boolean;
};

function evidencePayload(map: Record<number, Decision>) {
  return Object.entries(map)
    .filter(([, d]) => d === "accept" || d === "reject")
    .map(([evidenceId, decision]) => ({
      evidenceId: parseInt(evidenceId, 10),
      decision: decision as "accept" | "reject",
    }));
}

/** نص تأكيد إلغاء الاعتماد — متوافق مع API (مدير→مسودة، غيره→مراجعة إدارة) */
function revokeFinalConfirmMessage(enteredByRole?: string): string {
  if (enteredByRole === "DEPT_MANAGER") {
    return "سيُلغى الاعتماد النهائي وتُعاد القيمة مسودةً لمدخل المدير، وتختفي من لوحات التحليل حتى يُعتمد نهائيًا من جديد. السبب مطلوب. متابعة؟";
  }
  return "سيُلغى الاعتماد النهائي ويُعاد القياس بانتظار مراجعة الإدارة، وتختفي القيمة من لوحات التحليل حتى يُعتمد نهائيًا من جديد. السبب مطلوب. متابعة؟";
}

export default function ApprovalsClient() {
  const searchParams = useSearchParams();
  const [queue, setQueue] = useState<QueueMode>("pending");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const deepLinkConsumed = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setOpenId(null);
    const res = await fetch(`/api/approvals?queue=${queue}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
    } else if (res.status === 403) {
      notifyToast.error("الاعتماد النهائي لمشرف النظام فقط");
    }
    setLoading(false);
  }, [queue]);

  useEffect(() => {
    void load();
  }, [load]);

  // فتح القياس القادم من رابط الإشعار/البريد (?mp=) بعد تحميل القائمة — مرة واحدة
  useEffect(() => {
    if (deepLinkConsumed.current || loading) return;
    const mp = parseInt(searchParams.get("mp") ?? "", 10);
    if (Number.isNaN(mp)) return;
    deepLinkConsumed.current = true;
    if (entries.some((e) => e.id === mp)) setOpenId(mp);
  }, [loading, entries, searchParams]);

  const cards: CardItem[] = useMemo(
    () =>
      entries.map((e) => ({
        ...e,
        code: e.requirement.code,
        name: e.requirement.name,
        departmentName: e.requirement.department?.name ?? null,
        ownerName: e.requirement.owner?.name ?? null,
        enteredByName: e.employee.name,
        statusLabel: displayApprovalLabel(
          e.approvalStatus || (queue === "final" ? "FINAL_APPROVED" : "INITIAL_APPROVED"),
          e.rejectReason
        ),
        kpiCodes: e.requirement.kpis.map((k) => k.code),
        evidenceCount: e.evidences.filter((x) => x.status !== "REJECTED").length,
        awaiting: queue === "pending",
      })),
    [entries, queue]
  );

  const openEntry = entries.find((e) => e.id === openId) ?? null;

  const workbenchItem: ReviewWorkbenchItem | null = openEntry
    ? {
        measurementPeriodId: openEntry.id,
        code: openEntry.requirement.code,
        name: openEntry.requirement.name,
        unit: openEntry.requirement.unit,
        departmentName: openEntry.requirement.department?.name,
        ownerName: openEntry.requirement.owner?.name,
        enteredByName: openEntry.employee.name,
        enteredByRole: openEntry.employee.role,
        initialApproverName: openEntry.initialApprovedBy?.name,
        periodLabel: `${PERIOD_LABEL[openEntry.period as Period] || openEntry.period} ${openEntry.year}`,
        requiredData: openEntry.requirement.requiredData,
        kpiLabels: openEntry.requirement.kpis.map(
          (k) => `${k.code} (${KPI_TYPE[k.type as keyof typeof KPI_TYPE] ?? k.type})`
        ),
        actualValue: openEntry.actualValue,
        whatHappened: openEntry.whatHappened,
        howHappened: openEntry.howHappened,
        priorNotes: openEntry.rejectReason,
        evidences: openEntry.evidences,
      }
    : null;

  async function submit(
    action: "final_approve" | "return_for_edit" | "revoke_final",
    payload: {
      actualValue: number;
      whatHappened: string;
      howHappened: string;
      fieldDecisions: FieldDecisions;
      evidenceDecisions: Record<number, Decision>;
      notes?: string;
    }
  ) {
    if (!openEntry) return;
    if (
      action === "final_approve" &&
      (payload.actualValue !== openEntry.actualValue ||
        payload.whatHappened !== (openEntry.whatHappened ?? "") ||
        payload.howHappened !== (openEntry.howHappened ?? "")) &&
      !window.confirm("سيتم حفظ تعديلاتك مع الاعتماد النهائي. متابعة؟")
    ) {
      return;
    }
    if (
      action === "revoke_final" &&
      !window.confirm(revokeFinalConfirmMessage(openEntry.employee.role))
    ) {
      return;
    }

    setActing(true);
    const res = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        measurementPeriodId: openEntry.id,
        action,
        actualValue: payload.actualValue,
        whatHappened: payload.whatHappened || null,
        howHappened: payload.howHappened || null,
        fieldDecisions: action === "revoke_final" ? undefined : payload.fieldDecisions,
        evidenceDecisions:
          action === "revoke_final" ? undefined : evidencePayload(payload.evidenceDecisions),
        notes: payload.notes,
      }),
    });
    setActing(false);
    if (res.ok) {
      notifyToast.success(
        action === "final_approve"
          ? "تم الاعتماد النهائي"
          : action === "revoke_final"
            ? "أُلغي الاعتماد النهائي"
            : "أُعيد للتعديل مع إشعار المعنيين",
        { duration: "short" }
      );
      setOpenId(null);
      await load();
    } else {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشلت العملية");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>الاعتماد النهائي</h1>
          <div className="text-muted">مراجعة · اعتماد · إلغاء اعتماد نهائي — مشرف النظام</div>
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className={queue === "pending" ? "active" : ""}
          onClick={() => setQueue("pending")}
        >
          بانتظار الاعتماد
        </button>
        <button
          type="button"
          className={queue === "final" ? "active" : ""}
          onClick={() => setQueue("final")}
        >
          معتمد نهائياً
        </button>
      </div>

      <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
        {queue === "pending"
          ? "افتح البطاقة، قرّر قبول/رفض كل حقل وشاهد، ثم اعتمد نهائياً أو أعد للتعديل."
          : "افتح قياساً معتمداً نهائياً لإلغائه بسبب واضح — تختفي القيمة من اللوحات، ويعود القياس لمراجعة الإدارة (أو مسودة إن كان المدخل مديراً)."}
      </div>

      {loading ? (
        <p className="text-muted">جاري التحميل...</p>
      ) : (
        <ReviewSmartSearch items={cards}>
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
                statusClass: queue === "final" ? "badge-success" : "badge-primary",
                evidenceCount: c.evidenceCount,
                meta: `${PERIOD_LABEL[c.period as Period] || c.period} ${c.year}`,
                notesSnippet: notesCardSnippet(c.rejectReason),
              }))}
              emptyText={
                queue === "final"
                  ? "لا توجد قياسات معتمدة نهائياً."
                  : "لا توجد قياسات بانتظار الاعتماد النهائي."
              }
              onOpen={setOpenId}
            />
          )}
        </ReviewSmartSearch>
      )}

      <ReviewWorkbenchModal
        open={!!workbenchItem}
        item={workbenchItem}
        mode={queue === "final" ? "revoke" : "review"}
        approveLabel="اعتماد نهائي"
        returnLabel={queue === "final" ? "إلغاء الاعتماد النهائي" : "إعادة للتعديل"}
        busy={acting}
        onClose={() => setOpenId(null)}
        onApprove={(p) => void submit("final_approve", p)}
        onReturn={(p) =>
          void submit(queue === "final" ? "revoke_final" : "return_for_edit", p)
        }
      />
    </>
  );
}
