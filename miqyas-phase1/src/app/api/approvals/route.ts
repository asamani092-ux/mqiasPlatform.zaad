import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { recordApprovalEvent, syncKpiEntriesFromMeasurement } from "@/lib/measurement-sync";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import {
  allFieldsAccepted,
  anyRejected,
  buildRejectSummary,
  type Decision,
  type FieldDecisions,
} from "@/lib/review-feedback";
import { notifyMeasurementReturn } from "@/lib/review-notify";

export const dynamic = "force-dynamic";

const decisionEnum = z.enum(["accept", "reject"]);

const fieldDecisionsSchema = z.object({
  actual: decisionEnum,
  what: decisionEnum,
  how: decisionEnum,
});

const postSchema = z
  .object({
    measurementPeriodId: z.number().int().positive(),
    action: z.enum(["final_approve", "return_for_edit", "edit"]),
    notes: z.string().max(5000).optional(),
    comment: z.string().max(2000).optional(),
    actualValue: z.number().optional(),
    whatHappened: z.string().max(5000).optional().nullable(),
    howHappened: z.string().max(5000).optional().nullable(),
    fieldDecisions: fieldDecisionsSchema.optional(),
    evidenceDecisions: z
      .array(
        z.object({
          evidenceId: z.number().int().positive(),
          decision: decisionEnum,
        })
      )
      .optional(),
  })
  .strict();

function toDecisionMap(list?: { evidenceId: number; decision: "accept" | "reject" }[]): Record<number, Decision> {
  const map: Record<number, Decision> = {};
  for (const row of list ?? []) map[row.evidenceId] = row.decision;
  return map;
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!can.finalApprove(user)) return jsonError("غير مصرح", 403);

    const periods = await db.measurementPeriod.findMany({
      where: { approvalStatus: "INITIAL_APPROVED" },
      include: {
        requirement: {
          select: {
            code: true,
            name: true,
            unit: true,
            requiredData: true,
            fillerRole: true,
            owner: { select: { id: true, name: true, email: true } },
            department: { select: { id: true, name: true } },
            kpis: { select: { id: true, code: true, name: true, type: true }, where: { active: true } },
          },
        },
        enteredBy: { select: { id: true, name: true, email: true } },
        initialApprovedBy: { select: { id: true, name: true } },
        evidences: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            status: true,
            rejectReason: true,
          },
        },
      },
      orderBy: { initialApprovedAt: "desc" },
    });

    return NextResponse.json({
      entries: periods.map((mp) => ({
        id: mp.id,
        measurementPeriodId: mp.id,
        year: mp.year,
        period: mp.period,
        actualValue: mp.actualValue,
        whatHappened: mp.whatHappened,
        howHappened: mp.howHappened,
        note: mp.note,
        approvalStatus: mp.approvalStatus,
        suggestedWording: mp.suggestedWording,
        reviewFeedback: mp.reviewFeedback,
        requirement: mp.requirement,
        employee: mp.enteredBy,
        initialApprovedBy: mp.initialApprovedBy,
        evidences: mp.evidences,
      })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const userId = parseInt(user.id, 10);
    if (!can.finalApprove(user)) return jsonError("غير مصرح", 403);

    const body = postSchema.parse(await req.json());
    const mp = await db.measurementPeriod.findUnique({
      where: { id: body.measurementPeriodId },
      include: {
        requirement: {
          select: {
            code: true,
            name: true,
            ownerId: true,
            departmentId: true,
          },
        },
        evidences: { select: { id: true, fileName: true, status: true } },
        enteredBy: { select: { id: true } },
      },
    });
    if (!mp) return jsonError("فترة القياس غير موجودة", 404);

    if (body.action === "edit") {
      await db.measurementPeriod.update({
        where: { id: mp.id },
        data: {
          actualValue: body.actualValue ?? mp.actualValue,
          whatHappened: body.whatHappened !== undefined ? body.whatHappened : mp.whatHappened,
          howHappened: body.howHappened !== undefined ? body.howHappened : mp.howHappened,
        },
      });
      await syncKpiEntriesFromMeasurement(mp.id);
      await recordApprovalEvent({
        measurementPeriodId: mp.id,
        actorId: userId,
        action: "ADMIN_EDIT",
        comment: body.comment,
      });
      return NextResponse.json({ ok: true });
    }

    if (mp.approvalStatus !== "INITIAL_APPROVED") {
      return jsonError("القياس ليس بانتظار الاعتماد النهائي", 400);
    }

    const activeEvidenceIds = mp.evidences.filter((e) => e.status !== "REJECTED").map((e) => e.id);
    const fieldDecisions = (body.fieldDecisions ?? null) as FieldDecisions | null;
    const evidenceMap = toDecisionMap(body.evidenceDecisions);

    if (body.action === "final_approve") {
      if (!fieldDecisions) return jsonError("قرارات الحقول مطلوبة", 400);
      if (!allFieldsAccepted(fieldDecisions, activeEvidenceIds, evidenceMap)) {
        return jsonError("يجب قبول كل الحقول والشواهد قبل الاعتماد النهائي", 400);
      }
      if (body.actualValue != null || body.whatHappened !== undefined || body.howHappened !== undefined) {
        await db.measurementPeriod.update({
          where: { id: mp.id },
          data: {
            actualValue: body.actualValue ?? mp.actualValue,
            whatHappened: body.whatHappened !== undefined ? body.whatHappened : mp.whatHappened,
            howHappened: body.howHappened !== undefined ? body.howHappened : mp.howHappened,
          },
        });
      }
      const updated = await db.measurementPeriod.update({
        where: { id: mp.id },
        data: {
          approvalStatus: "FINAL_APPROVED",
          approvedById: userId,
          approvedAt: new Date(),
          rejectReason: null,
          suggestedWording: null,
          reviewFeedback: Prisma.DbNull,
        },
      });
      await syncKpiEntriesFromMeasurement(mp.id);
      await recordApprovalEvent({
        measurementPeriodId: mp.id,
        actorId: userId,
        action: "FINAL_APPROVE",
        comment: body.comment,
        payload: { fieldDecisions },
      });
      if (mp.requirement.ownerId) {
        await notify({
          userIds: [mp.requirement.ownerId],
          type: "APPROVAL_RESULT",
          title: "اعتُمد القياس نهائياً",
          body: `${mp.requirement.code} — ${mp.requirement.name}`,
          link: `/my?mp=${mp.id}`,
          email: true,
        });
      }
      await audit(userId, "FINAL_APPROVE", "MeasurementPeriod", mp.id, {});
      return NextResponse.json({ measurement: updated });
    }

    // return_for_edit
    if (!fieldDecisions) return jsonError("قرارات الحقول مطلوبة", 400);
    if (!anyRejected(fieldDecisions, evidenceMap)) {
      return jsonError("يجب رفض حقل أو شاهد واحد على الأقل", 400);
    }
    if (!body.notes?.trim() || body.notes.trim().length < 3) {
      return jsonError("ملاحظات الإعادة مطلوبة (3 أحرف على الأقل)", 400);
    }

    const evidenceNames: Record<number, string> = {};
    for (const e of mp.evidences) evidenceNames[e.id] = e.fileName;
    const { feedback, rejectReason, rejectedEvidenceIds } = buildRejectSummary(
      fieldDecisions,
      evidenceMap,
      evidenceNames,
      body.notes
    );
    feedback.layer = "final";

    for (const evidenceId of rejectedEvidenceIds) {
      await db.evidence.updateMany({
        where: { id: evidenceId, measurementPeriodId: mp.id },
        data: {
          status: "REJECTED",
          rejectReason: body.notes.trim(),
          rejectedById: userId,
          rejectedAt: new Date(),
        },
      });
    }

    const fieldRejected =
      fieldDecisions.actual === "reject" ||
      fieldDecisions.what === "reject" ||
      fieldDecisions.how === "reject";
    const evidenceRejected = rejectedEvidenceIds.length > 0;
    const nextStatus =
      fieldRejected && evidenceRejected
        ? "REJECTED"
        : evidenceRejected
          ? "REJECTED_EVIDENCE"
          : "REJECTED_WORDING";

    const updated = await db.measurementPeriod.update({
      where: { id: mp.id },
      data: {
        approvalStatus: nextStatus,
        rejectReason,
        reviewFeedback: feedback as unknown as Prisma.InputJsonValue,
        approvedById: userId,
        approvedAt: new Date(),
        initialApprovedById: null,
        initialApprovedAt: null,
        actualValue: body.actualValue ?? mp.actualValue,
        whatHappened: body.whatHappened !== undefined ? body.whatHappened : mp.whatHappened,
        howHappened: body.howHappened !== undefined ? body.howHappened : mp.howHappened,
      },
    });
    await syncKpiEntriesFromMeasurement(mp.id);
    await recordApprovalEvent({
      measurementPeriodId: mp.id,
      actorId: userId,
      action: evidenceRejected ? "REJECT_EVIDENCE" : "REJECT_WORDING",
      comment: body.notes,
      payload: feedback,
    });

    await notifyMeasurementReturn({
      measurementPeriodId: mp.id,
      requirementCode: mp.requirement.code,
      requirementName: mp.requirement.name,
      departmentId: mp.requirement.departmentId,
      ownerId: mp.requirement.ownerId,
      enteredById: mp.enteredBy.id,
      title: "أُعيد القياس للتعديل بعد الاعتماد النهائي",
      body: rejectReason,
      includeDeptManagers: true,
    });

    await audit(userId, "RETURN_FOR_EDIT", "MeasurementPeriod", mp.id, { status: nextStatus });
    return NextResponse.json({ measurement: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
