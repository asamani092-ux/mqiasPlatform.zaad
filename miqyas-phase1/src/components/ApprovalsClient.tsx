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
  type ReturnTarget,
  type ReviewWorkbenchItem,
} from "@/components/ui/ReviewWorkbenchModal";
import type { Decision, FieldDecisions } from "@/lib/review-feedback";
import { notesCardSnippet } from "@/lib/review-feedback";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";

type PreviousPeriodInfo = {
  year: number;
  period: string;
  actualValue: number | null;
  measurementPeriodId: number | null;
  approvalStatus: string | null;
  analysisHref: string;
};

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
  targetValue?: number | null;
  gap?: number | null;
  previousPeriod?: PreviousPeriodInfo | null;
  requirement: {
    code: string;
    name: string;
    unit: string;
    requiredData: string | null;
    owner: { id: number; name: string; email: string } | null;
    department: { id?: number; name: string } | null;
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

type QueueMode = "pending" | "final" | "closure";

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

type ClosureRow = {
  departmentId: number;
  departmentName: string;
  total: number;
  finalApproved: number;
  remaining: number;
  partial: number;
};

function evidencePayload(map: Record<number, Decision>) {
  return Object.entries(map)
    .filter(([, d]) => d === "accept" || d === "reject")
    .map(([evidenceId, decision]) => ({
      evidenceId: parseInt(evidenceId, 10),
      decision: decision as "accept" | "reject",
    }));
}

function revokeFinalConfirmMessage(returnTarget: ReturnTarget): string {
  if (returnTarget === "dept_review") {
    return "سيُلغى الاعتماد النهائي ويُعاد القياس بانتظار مراجعة الإدارة، وتختفي القيمة من لوحات التحليل. السبب مطلوب. متابعة؟";
  }
  return "سيُلغى الاعتماد النهائي وتُعاد القيمة مسودةً للموظف، مع إشعار المالك والمدير. تختفي من لوحات التحليل حتى الاعتماد النهائي من جديد. متابعة؟";
}

export default function ApprovalsClient() {
  const searchParams = useSearchParams();
  const [queue, setQueue] = useState<QueueMode>("pending");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [closureRows, setClosureRows] = useState<ClosureRow[]>([]);
  const [closureMeta, setClosureMeta] = useState<{ year: number; period: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [remindingDeptId, setRemindingDeptId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    destructive?: boolean;
    run: () => void;
  } | null>(null);
  const deepLinkConsumed = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setOpenId(null);
    if (queue === "closure") {
      const res = await fetch("/api/approvals/closure-progress");
      if (res.ok) {
        const data = await res.json();
        setClosureRows(data.rows ?? []);
        setClosureMeta({ year: data.year, period: data.period });
      } else if (res.status === 403) {
        notifyToast.error("متابعة الإغلاق لمشرف النظام فقط");
      }
      setLoading(false);
      return;
    }
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
    if (deepLinkConsumed.current || loading || queue === "closure") return;
    const mp = parseInt(searchParams.get("mp") ?? "", 10);
    if (Number.isNaN(mp)) return;
    deepLinkConsumed.current = true;
    if (entries.some((e) => e.id === mp)) setOpenId(mp);
  }, [loading, entries, searchParams, queue]);

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
        gapContext:
          queue === "pending"
            ? {
                targetValue: openEntry.targetValue ?? null,
                gap: openEntry.gap ?? null,
                previousPeriod: openEntry.previousPeriod ?? null,
              }
            : null,
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
      returnTarget?: ReturnTarget;
    }
  ) {
    if (!openEntry) return;
    if (
      action === "final_approve" &&
      (payload.actualValue !== openEntry.actualValue ||
        payload.whatHappened !== (openEntry.whatHappened ?? "") ||
        payload.howHappened !== (openEntry.howHappened ?? ""))
    ) {
      setConfirm({
        title: "تأكيد الاعتماد النهائي",
        body: "سيتم حفظ تعديلاتك مع الاعتماد النهائي. متابعة؟",
        run: () => void executeSubmit(action, payload),
      });
      return;
    }
    if (action === "revoke_final") {
      setConfirm({
        title: "إلغاء الاعتماد النهائي",
        body: revokeFinalConfirmMessage(payload.returnTarget ?? "owner_draft"),
        destructive: true,
        run: () => void executeSubmit(action, payload),
      });
      return;
    }

    await executeSubmit(action, payload);
  }

  async function executeSubmit(
    action: "final_approve" | "return_for_edit" | "revoke_final",
    payload: {
      actualValue: number;
      whatHappened: string;
      howHappened: string;
      fieldDecisions: FieldDecisions;
      evidenceDecisions: Record<number, Decision>;
      notes?: string;
      returnTarget?: ReturnTarget;
    }
  ) {
    if (!openEntry) return;
    setConfirm(null);
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
        returnTarget: action === "revoke_final" ? payload.returnTarget : undefined,
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

  async function remindDepartment(departmentId: number) {
    setRemindingDeptId(departmentId);
    const res = await fetch("/api/approvals/closure-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId }),
    });
    setRemindingDeptId(null);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      notifyToast.success(
        data.notified != null ? `أُرسل تذكير لـ ${data.notified} مسؤولًا` : "أُرسل التذكير",
        { duration: "normal" }
      );
    } else {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل إرسال التذكير");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <PageBreadcrumb
            items={[
              { label: "الرئيسية", href: "/dashboard" },
              { label: "الاعتماد النهائي" },
            ]}
          />
          <h1>الاعتماد النهائي</h1>
          <div className="text-muted">مراجعة · اعتماد · إلغاء اعتماد نهائي · متابعة الإغلاق</div>
        </div>
      </div>

      <ol className="zad-stepper" aria-label="مراحل الاعتماد">
        <li className={`zad-stepper__item ${queue === "pending" ? "is-current" : "is-done"}`}>
          <span className="zad-stepper__dot" aria-hidden="true" /> بانتظار الاعتماد
        </li>
        <li
          className={`zad-stepper__item ${
            queue === "final" ? "is-current" : queue === "closure" ? "is-done" : ""
          }`}
        >
          <span className="zad-stepper__dot" aria-hidden="true" /> معتمد نهائيًا
        </li>
        <li className={`zad-stepper__item ${queue === "closure" ? "is-current" : ""}`}>
          <span className="zad-stepper__dot" aria-hidden="true" /> متابعة الإغلاق
        </li>
      </ol>

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
        <button
          type="button"
          className={queue === "closure" ? "active" : ""}
          onClick={() => setQueue("closure")}
        >
          متابعة الإغلاق
        </button>
      </div>

      <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
        {queue === "pending"
          ? "افتح البطاقة، راجع المستهدف/المتحقق/الفجوة، قرّر قبول/رفض كل حقل وشاهد، ثم اعتمد نهائياً أو أعد للتعديل."
          : queue === "final"
            ? "افتح قياساً معتمداً نهائياً لإلغائه — اختر مسودة للموظف أو إعادة لمراجعة المدير."
            : `متابعة إغلاق الجولة${
                closureMeta
                  ? ` — ${PERIOD_LABEL[closureMeta.period as Period] || closureMeta.period} ${closureMeta.year}`
                  : ""
              }.`}
      </div>

      {loading ? (
        <Skeleton lines={5} />
      ) : queue === "closure" ? (
        closureRows.length === 0 ? (
          <EmptyState
            title="لا بيانات إغلاق"
            body="لا بيانات لمتابعة الإغلاق في جولة القياس الحالية."
          />
        ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>الإدارة</th>
                <th>عدد المؤشرات</th>
                <th>متحقق (نهائي)</th>
                <th>متبقي</th>
                <th>متحقق جزئي</th>
                <th>التقدّم</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {closureRows.map((row) => (
                  <tr key={row.departmentId}>
                    <td data-label="الإدارة">{row.departmentName}</td>
                    <td data-label="عدد المؤشرات">{row.total}</td>
                    <td data-label="متحقق (نهائي)">{row.finalApproved}</td>
                    <td data-label="متبقي">{row.remaining}</td>
                    <td data-label="متحقق جزئي">{row.partial}</td>
                    <td data-label="التقدّم">
                      <ProgressBar
                        value={row.total ? (row.finalApproved / row.total) * 100 : 0}
                        label={`${row.finalApproved}/${row.total}`}
                        tone={row.remaining === 0 ? "success" : "brand"}
                      />
                    </td>
                    <td data-label="">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        disabled={row.remaining === 0 || remindingDeptId === row.departmentId}
                        onClick={() => void remindDepartment(row.departmentId)}
                      >
                        {remindingDeptId === row.departmentId ? "جاري الإرسال..." : "تذكير"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        )
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

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        body={confirm?.body ?? ""}
        destructive={confirm?.destructive}
        busy={acting}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.run()}
      />
    </>
  );
}
