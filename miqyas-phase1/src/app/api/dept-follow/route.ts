import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { recordApprovalEvent, syncKpiEntriesFromMeasurement } from "@/lib/measurement-sync";
import { canDeptReturn, canDeptReview, isFinalApproved } from "@/lib/approval-status";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    measurementPeriodId: z.number().int().positive(),
    action: z.enum(["update", "initial_approve", "return_edit"]),
    actualValue: z.number().optional(),
    whatHappened: z.string().max(5000).optional().nullable(),
    howHappened: z.string().max(5000).optional().nullable(),
    note: z.string().max(5000).optional().nullable(),
    comment: z.string().max(2000).optional().nullable(),
  })
  .strict();

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
            code: true,
            name: true,
            departmentId: true,
            ownerId: true,
          },
        },
        enteredBy: { select: { id: true } },
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

    if (body.action === "return_edit") {
      if (!canDeptReturn(mp.approvalStatus)) {
        return jsonError("لا يمكن إرجاع القياس في هذه الحالة", 400);
      }
      if (!body.comment?.trim() || body.comment.trim().length < 3) {
        return jsonError("سبب الإرجاع مطلوب (3 أحرف على الأقل)", 400);
      }
      const updated = await db.measurementPeriod.update({
        where: { id: mp.id },
        data: {
          approvalStatus: "DRAFT",
          rejectReason: body.comment.trim(),
          suggestedWording: null,
          initialApprovedById: null,
          initialApprovedAt: null,
          approvedById: null,
          approvedAt: null,
        },
      });
      await syncKpiEntriesFromMeasurement(mp.id);
      await recordApprovalEvent({
        measurementPeriodId: mp.id,
        actorId: userId,
        action: "RETURN_EDIT",
        comment: body.comment,
      });
      if (mp.requirement.ownerId) {
        await notify({
          userIds: [mp.requirement.ownerId],
          type: "APPROVAL_RESULT",
          title: "أُعيد القياس للتعديل",
          body: `${mp.requirement.code}: ${body.comment || "يرجى المراجعة وإعادة التقديم"}`,
          link: "/my",
          email: true,
        });
      }
      return NextResponse.json({ measurement: updated });
    }

    // initial_approve
    if (!["SUBMITTED", "PENDING"].includes(mp.approvalStatus)) {
      return jsonError("القياس ليس بانتظار الاعتماد المبدئي", 400);
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
      },
    });
    await syncKpiEntriesFromMeasurement(mp.id);
    await recordApprovalEvent({
      measurementPeriodId: mp.id,
      actorId: userId,
      action: "INITIAL_APPROVE",
      comment: body.comment,
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
