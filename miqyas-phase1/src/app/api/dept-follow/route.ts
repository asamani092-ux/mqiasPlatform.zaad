import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { recordApprovalEvent, syncKpiEntriesFromMeasurement } from "@/lib/measurement-sync";
import { canDeptReturn, canDeptReview, isFinalApproved } from "@/lib/approval-status";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import {
  allFieldsAccepted,
  anyRejected,
  buildRejectSummary,
  type Decision,
  type FieldDecisions,
} from "@/lib/review-feedback";
import { notifyMeasurementReturn } from "@/lib/review-notify";
import { rebindOwnerIfMissing } from "@/lib/requirement-owner";

export const dynamic = "force-dynamic";

const decisionEnum = z.enum(["accept", "reject"]);

const fieldDecisionsSchema = z.object({
  actual: decisionEnum,
  what: decisionEnum,
  how: decisionEnum,
});

const patchSchema = z
  .object({
    measurementPeriodId: z.number().int().positive(),
    action: z.enum(["update", "initial_approve", "return_edit"]),
    actualValue: z.number().optional(),
    whatHappened: z.string().max(5000).optional().nullable(),
    howHappened: z.string().max(5000).optional().nullable(),
    note: z.string().max(5000).optional().nullable(),
    comment: z.string().max(2000).optional().nullable(),
    notes: z.string().max(5000).optional(),
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

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.reviewDepartment(user)) return jsonError("غير مصرح", 403);

    const body = patchSchema.parse(await req.json());
    const userId = parseInt(user.id, 10);

    const mp = await db.measurementPeriod.findUnique({
      where: { id: body.measurementPeriodId },
      include: {
        requirement: {
          select: {
            id: true,
            code: true,
            name: true,
            departmentId: true,
            sectionId: true,
            ownerId: true,
          },
        },
        enteredBy: {
          select: { id: true, role: true, departmentId: true, sectionId: true, status: true },
        },
        evidences: { select: { id: true, fileName: true, status: true } },
      },
    });
    if (!mp) return jsonError("فترة القياس غير موجودة", 404);

    if (
      user.role === "DEPT_MANAGER" &&
      (user.departmentId == null || mp.requirement.departmentId !== user.departmentId)
    ) {
      return jsonError("خارج نطاق إدارتك", 403);
    }

    if (isFinalApproved(mp.approvalStatus)) {
      return jsonError("لا يمكن تعديل قياس معتمد نهائياً", 400);
    }

    if (body.action === "update") {
      if (!canDeptReview(mp.approvalStatus)) {
        return jsonError("لا يمكن التعديل في هذه الحالة", 400);
      }
      const updated = await db.measurementPeriod.update({
        where: { id: mp.id },
        data: {
          actualValue: body.actualValue ?? mp.actualValue,
          whatHappened: body.whatHappened !== undefined ? body.whatHappened : mp.whatHappened,
          howHappened: body.howHappened !== undefined ? body.howHappened : mp.howHappened,
          note: body.note !== undefined ? body.note : mp.note,
        },
      });
      await syncKpiEntriesFromMeasurement(mp.id);
      await recordApprovalEvent({
        measurementPeriodId: mp.id,
        actorId: userId,
        action: "ADMIN_EDIT",
        comment: body.comment,
      });
      await audit(userId, "DEPT_UPDATE_MEASUREMENT", "MeasurementPeriod", mp.id, {});
      return NextResponse.json({ measurement: updated });
    }

    const activeEvidenceIds = mp.evidences.filter((e) => e.status !== "REJECTED").map((e) => e.id);
    const fieldDecisions = (body.fieldDecisions ?? null) as FieldDecisions | null;
    const evidenceMap = toDecisionMap(body.evidenceDecisions);

    if (body.action === "return_edit") {
      if (!canDeptReturn(mp.approvalStatus)) {
        return jsonError("لا يمكن إرجاع القياس في هذه الحالة", 400);
      }
      const notes = (body.notes || body.comment || "").trim();
      if (!fieldDecisions) return jsonError("قرارات الحقول مطلوبة", 400);
      if (!anyRejected(fieldDecisions, evidenceMap)) {
        return jsonError("يجب رفض حقل أو شاهد واحد على الأقل", 400);
      }
      if (notes.length < 3) {
        return jsonError("ملاحظات الإعادة مطلوبة (3 أحرف على الأقل)", 400);
      }

      const evidenceNames: Record<number, string> = {};
      for (const e of mp.evidences) evidenceNames[e.id] = e.fileName;
      const { feedback, rejectReason, rejectedEvidenceIds } = buildRejectSummary(
        fieldDecisions,
        evidenceMap,
        evidenceNames,
        notes
      );
      feedback.layer = "dept";

      for (const evidenceId of rejectedEvidenceIds) {
        await db.evidence.updateMany({
          where: { id: evidenceId, measurementPeriodId: mp.id },
          data: {
            status: "REJECTED",
            rejectReason: notes,
            rejectedById: userId,
            rejectedAt: new Date(),
          },
        });
      }

      const updated = await db.measurementPeriod.update({
        where: { id: mp.id },
        data: {
          approvalStatus: "DRAFT",
          rejectReason,
          reviewFeedback: feedback as unknown as Prisma.InputJsonValue,
          suggestedWording: null,
          initialApprovedById: null,
          initialApprovedAt: null,
          approvedById: null,
          approvedAt: null,
          actualValue: body.actualValue ?? mp.actualValue,
          whatHappened: body.whatHappened !== undefined ? body.whatHappened : mp.whatHappened,
          howHappened: body.howHappened !== undefined ? body.howHappened : mp.howHappened,
        },
      });
      await syncKpiEntriesFromMeasurement(mp.id);
      await recordApprovalEvent({
        measurementPeriodId: mp.id,
        actorId: userId,
        action: "RETURN_EDIT",
        comment: notes,
        payload: feedback,
      });

      const ownerId = await rebindOwnerIfMissing({
        requirementId: mp.requirement.id,
        ownerId: mp.requirement.ownerId,
        departmentId: mp.requirement.departmentId,
        sectionId: mp.requirement.sectionId,
        enteredBy: mp.enteredBy,
      });

      await notifyMeasurementReturn({
        measurementPeriodId: mp.id,
        requirementCode: mp.requirement.code,
        requirementName: mp.requirement.name,
        departmentId: mp.requirement.departmentId,
        ownerId,
        enteredById: mp.enteredBy.id,
        title: "أُعيد القياس للتعديل من مراجعة الإدارة",
        body: rejectReason,
        includeDeptManagers: false,
      });

      return NextResponse.json({ measurement: updated });
    }

    // initial_approve — للموظف/رئيس القسم فقط؛ لا اعتماد ذاتي لما أدخله المدير
    if (!["SUBMITTED", "PENDING"].includes(mp.approvalStatus)) {
      return jsonError("القياس ليس بانتظار الاعتماد المبدئي", 400);
    }
    if (mp.enteredBy.id === userId || mp.requirement.ownerId === userId) {
      return jsonError(
        "لا يمكن الاعتماد المبدئي لما أدخلته أو تملكه — تقديم المدير يتجاوز هذه الطبقة",
        400
      );
    }
    if (!fieldDecisions) return jsonError("قرارات الحقول مطلوبة", 400);
    if (!allFieldsAccepted(fieldDecisions, activeEvidenceIds, evidenceMap)) {
      return jsonError("يجب قبول كل الحقول والشواهد قبل الاعتماد المبدئي", 400);
    }

    const updated = await db.measurementPeriod.update({
      where: { id: mp.id },
      data: {
        actualValue: body.actualValue ?? mp.actualValue,
        whatHappened: body.whatHappened !== undefined ? body.whatHappened : mp.whatHappened,
        howHappened: body.howHappened !== undefined ? body.howHappened : mp.howHappened,
        note: body.note !== undefined ? body.note : mp.note,
        approvalStatus: "INITIAL_APPROVED",
        initialApprovedById: userId,
        initialApprovedAt: new Date(),
        rejectReason: null,
        reviewFeedback: Prisma.DbNull,
      },
    });
    await syncKpiEntriesFromMeasurement(mp.id);
    await recordApprovalEvent({
      measurementPeriodId: mp.id,
      actorId: userId,
      action: "INITIAL_APPROVE",
      comment: body.comment,
      payload: { fieldDecisions },
    });

    const admins = await db.user.findMany({
      where: { role: "SYSTEM_ADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    if (admins.length > 0) {
      await notify({
        userIds: admins.map((a) => a.id),
        type: "APPROVAL_REQUEST",
        title: "قياس بانتظار الاعتماد النهائي",
        body: `${mp.requirement.code} — ${mp.requirement.name}`,
        link: "/approvals",
        email: true,
      });
    }

    await audit(userId, "INITIAL_APPROVE", "MeasurementPeriod", mp.id, {});
    return NextResponse.json({ measurement: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
