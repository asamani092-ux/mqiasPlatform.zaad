import { Prisma, type ApprovalStatus, type Period } from "@prisma/client";
import { db } from "@/lib/db";
import { achievementPct, deviationValue, kpiStatus } from "@/lib/kpi";
import { FINAL_APPROVED_STATUSES, isFinalApproved } from "@/lib/approval-status";

export type MeasurementWriteInput = {
  requirementId: number;
  year: number;
  period: Period;
  actualValue: number;
  whatHappened?: string | null;
  howHappened?: string | null;
  note?: string | null;
  enteredById: number;
  approvalStatus?: ApprovalStatus;
  approvedById?: number | null;
  approvedAt?: Date | null;
  initialApprovedById?: number | null;
  initialApprovedAt?: Date | null;
  rejectReason?: string | null;
  suggestedWording?: string | null;
  /** undefined = لا تغيّر · null = امسح */
  reviewFeedback?: Prisma.InputJsonValue | null;
};

/**
 * جسر التحليل ← الاعتماد: يكتب KpiEntry فقط عند الاعتماد النهائي.
 * غير النهائي: يفك ربط الشواهد ثم يحذف أي إسقاط سابق لنفس (kpi,year,period).
 * Time O(k) · Space O(1)
 */
export async function syncKpiEntriesFromMeasurement(
  measurementPeriodId: number,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? db;
  const mp = await client.measurementPeriod.findUnique({
    where: { id: measurementPeriodId },
    include: {
      requirement: { include: { kpis: { select: { id: true, polarity: true } } } },
      evidences: { where: { status: "ACTIVE" } },
    },
  });
  if (!mp) return { synced: 0, removed: 0 };

  const kpiIds = mp.requirement.kpis.map((k) => k.id);
  if (kpiIds.length === 0) return { synced: 0, removed: 0 };

  // خارج النهائي → إزالة إسقاطات التحليل فقط (لا مساس بـ MeasurementPeriod/Evidence)
  if (!isFinalApproved(mp.approvalStatus)) {
    const existing = await client.kpiEntry.findMany({
      where: {
        kpiId: { in: kpiIds },
        year: mp.year,
        period: mp.period,
      },
      select: { id: true },
    });
    if (existing.length === 0) return { synced: 0, removed: 0 };

    const entryIds = existing.map((e) => e.id);
    // فك الربط حتى لا Cascade يحذف شواهد فترة القياس
    await client.evidence.updateMany({
      where: { kpiEntryId: { in: entryIds } },
      data: { kpiEntryId: null },
    });
    const del = await client.kpiEntry.deleteMany({
      where: { id: { in: entryIds } },
    });
    return { synced: 0, removed: del.count };
  }

  // استعلام واحد للمستهدفات بدل findUnique لكل مؤشر (N+1)
  const targets = await client.kpiTarget.findMany({
    where: { kpiId: { in: kpiIds }, year: mp.year, period: mp.period },
    select: { kpiId: true, targetValue: true },
  });
  const targetByKpi = new Map(targets.map((t) => [t.kpiId, t.targetValue]));

  let synced = 0;
  for (const kpi of mp.requirement.kpis) {
    const targetValue = targetByKpi.get(kpi.id);
    const pct =
      targetValue != null ? achievementPct(mp.actualValue, targetValue, kpi.polarity) : null;
    const dev = targetValue != null ? deviationValue(mp.actualValue, targetValue) : null;
    const status = kpiStatus(pct);

    const entry = await client.kpiEntry.upsert({
      where: {
        kpiId_year_period: { kpiId: kpi.id, year: mp.year, period: mp.period },
      },
      create: {
        kpiId: kpi.id,
        year: mp.year,
        period: mp.period,
        actualValue: mp.actualValue,
        whatHappened: mp.whatHappened,
        howHappened: mp.howHappened,
        note: mp.note,
        achievementPct: pct,
        deviationValue: dev,
        status,
        enteredById: mp.enteredById,
        approvalStatus: "FINAL_APPROVED",
        approvedById: mp.approvedById,
        approvedAt: mp.approvedAt,
        rejectReason: null,
      },
      update: {
        actualValue: mp.actualValue,
        whatHappened: mp.whatHappened,
        howHappened: mp.howHappened,
        note: mp.note,
        achievementPct: pct,
        deviationValue: dev,
        status,
        approvalStatus: "FINAL_APPROVED",
        approvedById: mp.approvedById,
        approvedAt: mp.approvedAt,
        rejectReason: null,
        enteredById: mp.enteredById,
      },
    });

    for (const ev of mp.evidences) {
      if (ev.kpiEntryId === entry.id) continue;
      if (ev.kpiEntryId == null) {
        await client.evidence.update({
          where: { id: ev.id },
          data: { kpiEntryId: entry.id },
        });
      }
    }
    synced++;
  }

  return { synced, removed: 0 };
}

export { FINAL_APPROVED_STATUSES };

export async function recordApprovalEvent(
  input: {
    measurementPeriodId: number;
    actorId: number;
    action:
      | "SAVE_DRAFT"
      | "SUBMIT"
      | "INITIAL_APPROVE"
      | "FINAL_APPROVE"
      | "REJECT_WORDING"
      | "REJECT_EVIDENCE"
      | "RETURN_EDIT"
      | "ADMIN_EDIT";
    comment?: string | null;
    payload?: unknown;
  },
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? db;
  await client.approvalEvent.create({
    data: {
      measurementPeriodId: input.measurementPeriodId,
      actorId: input.actorId,
      action: input.action,
      comment: input.comment ?? null,
      payload: input.payload != null ? JSON.stringify(input.payload) : null,
    },
  });
}

/** كتابة قياس الفترة الموحّد ثم مزامنة المؤشرات المرتبطة (النهائي فقط) */
export async function upsertMeasurementPeriod(input: MeasurementWriteInput) {
  const mp = await db.measurementPeriod.upsert({
    where: {
      requirementId_year_period: {
        requirementId: input.requirementId,
        year: input.year,
        period: input.period,
      },
    },
    create: {
      requirementId: input.requirementId,
      year: input.year,
      period: input.period,
      actualValue: input.actualValue,
      whatHappened: input.whatHappened ?? null,
      howHappened: input.howHappened ?? null,
      note: input.note ?? null,
      enteredById: input.enteredById,
      approvalStatus: input.approvalStatus ?? "DRAFT",
      approvedById: input.approvedById ?? null,
      approvedAt: input.approvedAt ?? null,
      initialApprovedById: input.initialApprovedById ?? null,
      initialApprovedAt: input.initialApprovedAt ?? null,
      rejectReason: input.rejectReason ?? null,
      suggestedWording: input.suggestedWording ?? null,
      reviewFeedback:
        input.reviewFeedback === null
          ? Prisma.DbNull
          : input.reviewFeedback !== undefined
            ? input.reviewFeedback
            : undefined,
    },
    update: {
      actualValue: input.actualValue,
      whatHappened: input.whatHappened ?? null,
      howHappened: input.howHappened ?? null,
      note: input.note ?? null,
      approvalStatus: input.approvalStatus ?? "DRAFT",
      approvedById: input.approvedById ?? null,
      approvedAt: input.approvedAt ?? null,
      initialApprovedById:
        input.initialApprovedById !== undefined ? input.initialApprovedById : undefined,
      initialApprovedAt:
        input.initialApprovedAt !== undefined ? input.initialApprovedAt : undefined,
      rejectReason: input.rejectReason !== undefined ? input.rejectReason : undefined,
      suggestedWording:
        input.suggestedWording !== undefined ? input.suggestedWording : undefined,
      reviewFeedback:
        input.reviewFeedback === null
          ? Prisma.DbNull
          : input.reviewFeedback !== undefined
            ? input.reviewFeedback
            : undefined,
    },
  });

  await syncKpiEntriesFromMeasurement(mp.id);
  return mp;
}
