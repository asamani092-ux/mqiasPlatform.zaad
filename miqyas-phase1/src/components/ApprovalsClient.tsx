"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type Entry = {
  id: number;
  measurementPeriodId: number;
  year: number;
  period: string;
  actualValue: number;
  whatHappened: string | null;
  howHappened: string | null;
  requirement: {
    code: string;
    name: string;
    unit: string;
    requiredData: string | null;
    owner: { id: number; name: string; email: string } | null;
    department: { name: string } | null;
    kpis: { id: number; code: string; name: string; type: string }[];
  };
  employee: { id: number; name: string; email: string };
  initialApprovedBy: { id: number; name: string } | null;
  evidences: {
    id: number;
    fileName: string;
    mimeType?: string | null;
    status: string;
    rejectReason: string | null;
  }[];
};

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

export default function ApprovalsClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/approvals");
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
    } else if (res.status === 403) {
      notifyToast.error("الاعتماد النهائي لمشرف النظام فقط");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cards: CardItem[] = useMemo(
    () =>
      entries.map((e) => ({
        ...e,
        code: e.requirement.code,
        name: e.requirement.name,
        departmentName: e.requirement.department?.name ?? null,
        ownerName: e.requirement.owner?.name ?? null,
        enteredByName: e.employee.name,
        statusLabel: displayApprovalLabel("INITIAL_APPROVED"),
        kpiCodes: e.requirement.kpis.map((k) => k.code),
        evidenceCount: e.evidences.filter((x) => x.status !== "REJECTED").length,
        awaiting: true,
      })),
    [entries]
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
        initialApproverName: openEntry.initialApprovedBy?.name,
        periodLabel: `${PERIOD_LABEL[openEntry.period as Period] || openEntry.period} ${openEntry.year}`,
        requiredData: openEntry.requirement.requiredData,
        kpiLabels: openEntry.requirement.kpis.map(
          (k) => `${k.code} (${KPI_TYPE[k.type as keyof typeof KPI_TYPE] ?? k.type})`
        ),
        actualValue: openEntry.actualValue,
        whatHappened: openEntry.whatHappened,
        howHappened: openEntry.howHappened,
        evidences: openEntry.evidences,
      }
    : null;

  async function submit(
    action: "final_approve" | "return_for_edit",
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
        fieldDecisions: payload.fieldDecisions,
        evidenceDecisions: evidencePayload(payload.evidenceDecisions),
        notes: payload.notes,
      }),
    });
    setActing(false);
    if (res.ok) {
      notifyToast.success(
        action === "final_approve" ? "تم الاعتماد النهائي" : "أُعيد للتعديل مع إشعار المعنيين",
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
          <div className="text-muted">بطاقات + نافذة مراجعة — مشرف النظام فقط</div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
        افتح البطاقة، قرّر قبول/رفض كل حقل وشاهد، ثم اعتمد نهائياً أو أعد للتعديل مع ملاحظات.
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
                statusClass: "badge-primary",
                evidenceCount: c.evidenceCount,
                meta: `${PERIOD_LABEL[c.period as Period] || c.period} ${c.year}`,
              }))}
              emptyText="لا توجد قياسات بانتظار الاعتماد النهائي."
              onOpen={setOpenId}
            />
          )}
        </ReviewSmartSearch>
      )}

      <ReviewWorkbenchModal
        open={!!workbenchItem}
        item={workbenchItem}
        approveLabel="اعتماد نهائي"
        returnLabel="إعادة للتعديل"
        busy={acting}
        onClose={() => setOpenId(null)}
        onApprove={(p) => void submit("final_approve", p)}
        onReturn={(p) => void submit("return_for_edit", p)}
      />
    </>
  );
}
