import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { recordApprovalEvent, syncKpiEntriesFromMeasurement } from "@/lib/measurement-sync";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const postSchema = z
  .object({
    measurementPeriodId: z.number().int().positive(),
    action: z.enum(["final_approve", "reject_wording", "reject_evidence", "edit"]),
    rejectReason: z.string().min(3).max(2000).optional(),
    suggestedWording: z.string().max(5000).optional().nullable(),
    comment: z.string().max(2000).optional(),
    actualValue: z.number().optional(),
    whatHappened: z.string().max(5000).optional().nullable(),
    howHappened: z.string().max(5000).optional().nullable(),
    evidenceRejections: z
      .array(
        z.object({
          evidenceId: z.number().int().positive(),
          reason: z.string().min(3).max(2000),
        })
      )
      .optional(),
  })
  .strict();

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
            department: { select: { name: true } },
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
        requirement: { select: { code: true, name: true, ownerId: true } },
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

    if (body.action === "final_approve") {
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
        },
      });
      await syncKpiEntriesFromMeasurement(mp.id);
      await recordApprovalEvent({
        measurementPeriodId: mp.id,
        actorId: userId,
        action: "FINAL_APPROVE",
        comment: body.comment,
      });
      if (mp.requirement.ownerId) {
        await notify({
          userIds: [mp.requirement.ownerId],
          type: "APPROVAL_RESULT",
          title: "اعتُمد القياس نهائياً",
          body: `${mp.requirement.code} — ${mp.requirement.name}`,
          link: "/my",
          email: true,
        });
      }
      await audit(userId, "FINAL_APPROVE", "MeasurementPeriod", mp.id, {});
      return NextResponse.json({ measurement: updated });
    }

    if (body.action === "reject_wording") {
      if (!body.rejectReason) return jsonError("سبب رفض الصياغة مطلوب", 400);
      const updated = await db.measurementPeriod.update({
        where: { id: mp.id },
        data: {
          approvalStatus: "REJECTED_WORDING",
          rejectReason: body.rejectReason,
          suggestedWording: body.suggestedWording ?? null,
          approvedById: userId,
          approvedAt: new Date(),
          initialApprovedById: null,
          initialApprovedAt: null,
        },
      });
      await syncKpiEntriesFromMeasurement(mp.id);
      await recordApprovalEvent({
        measurementPeriodId: mp.id,
        actorId: userId,
        action: "REJECT_WORDING",
        comment: body.rejectReason,
        payload: { suggestedWording: body.suggestedWording },
      });
      if (mp.requirement.ownerId) {
        await notify({
          userIds: [mp.requirement.ownerId],
          type: "APPROVAL_RESULT",
          title: "رُفضت صياغة القياس",
          body: body.rejectReason,
          link: "/my",
          email: true,
        });
      }
      await audit(userId, "REJECT_WORDING", "MeasurementPeriod", mp.id, {});
      return NextResponse.json({ measurement: updated });
    }

    // reject_evidence
    if (!body.rejectReason && !(body.evidenceRejections?.length)) {
      return jsonError("حدّد سبب رفض الشواهد أو شاهدًا بعينه", 400);
    }
    if (body.evidenceRejections?.length) {
      for (const er of body.evidenceRejections) {
        await db.evidence.updateMany({
          where: { id: er.evidenceId, measurementPeriodId: mp.id },
          data: {
            status: "REJECTED",
            rejectReason: er.reason,
            rejectedById: userId,
            rejectedAt: new Date(),
          },
        });
      }
    }
    const updated = await db.measurementPeriod.update({
      where: { id: mp.id },
      data: {
        approvalStatus: "REJECTED_EVIDENCE",
        rejectReason: body.rejectReason ?? "رُفضت شواهد القياس",
        approvedById: userId,
        approvedAt: new Date(),
        initialApprovedById: null,
        initialApprovedAt: null,
      },
    });
    await syncKpiEntriesFromMeasurement(mp.id);
    await recordApprovalEvent({
      measurementPeriodId: mp.id,
      actorId: userId,
      action: "REJECT_EVIDENCE",
      comment: body.rejectReason,
      payload: { evidenceRejections: body.evidenceRejections },
    });
    if (mp.requirement.ownerId) {
      await notify({
        userIds: [mp.requirement.ownerId],
        type: "APPROVAL_RESULT",
        title: "رُفضت شواهد القياس",
        body: body.rejectReason ?? "يرجى استبدال الشواهد وإعادة التقديم",
        link: "/my",
        email: true,
      });
    }
    await audit(userId, "REJECT_EVIDENCE", "MeasurementPeriod", mp.id, {});
    return NextResponse.json({ measurement: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
