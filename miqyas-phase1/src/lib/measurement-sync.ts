import type { ApprovalStatus, Period } from "@prisma/client";
import { db } from "@/lib/db";
import { achievementPct, deviationValue, kpiStatus } from "@/lib/kpi";

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
};

/** يزامن كل KpiEntry المرتبطة بالمتطلب من MeasurementPeriod — O(k) */
export async function syncKpiEntriesFromMeasurement(measurementPeriodId: number) {
  const mp = await db.measurementPeriod.findUnique({
    where: { id: measurementPeriodId },
    include: {
      requirement: { include: { kpis: { select: { id: true, polarity: true } } } },
      evidences: true,
    },
  });
  if (!mp) return { synced: 0 };

  let synced = 0;
  for (const kpi of mp.requirement.kpis) {
    const target = await db.kpiTarget.findUnique({
      where: {
        kpiId_year_period: { kpiId: kpi.id, year: mp.year, period: mp.period },
      },
    });
    const pct =
      target != null ? achievementPct(mp.actualValue, target.targetValue, kpi.polarity) : null;
    const dev = target != null ? deviationValue(mp.actualValue, target.targetValue) : null;
    const status = kpiStatus(pct);

    const entry = await db.kpiEntry.upsert({
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
        approvalStatus: mp.approvalStatus,
        approvedById: mp.approvedById,
        approvedAt: mp.approvedAt,
        rejectReason: mp.rejectReason,
      },
      update: {
        actualValue: mp.actualValue,
        whatHappened: mp.whatHappened,
        howHappened: mp.howHappened,
        note: mp.note,
        achievementPct: pct,
        deviationValue: dev,
        status,
        approvalStatus: mp.approvalStatus,
        approvedById: mp.approvedById,
        approvedAt: mp.approvedAt,
        rejectReason: mp.rejectReason,
      },
    });

    for (const ev of mp.evidences) {
      if (ev.kpiEntryId === entry.id) continue;
      if (ev.kpiEntryId == null) {
        await db.evidence.update({
          where: { id: ev.id },
          data: { kpiEntryId: entry.id },
        });
      }
    }
    synced++;
  }

  return { synced };
}

export async function recordApprovalEvent(input: {
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
}) {
  await db.approvalEvent.create({
    data: {
      measurementPeriodId: input.measurementPeriodId,
      actorId: input.actorId,
      action: input.action,
      comment: input.comment ?? null,
      payload: input.payload != null ? JSON.stringify(input.payload) : null,
    },
  });
}

/** كتابة قياس الفترة الموحّد ثم مزامنة المؤشرات المرتبطة */
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
      rejectReason: input.rejectReason ?? null,
      suggestedWording:
        input.suggestedWording !== undefined ? input.suggestedWording : undefined,
    },
  });

  await syncKpiEntriesFromMeasurement(mp.id);
  return mp;
}
