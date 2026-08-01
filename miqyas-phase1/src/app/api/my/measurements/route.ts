import { NextResponse } from "next/server";
import { z } from "zod";
import type { Period } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { getMyRequirements } from "@/lib/my-measurements";
import { recordApprovalEvent, upsertMeasurementPeriod } from "@/lib/measurement-sync";
import { canFillerEdit, roleToFillerRole } from "@/lib/approval-status";
import { resolvePeriods } from "@/lib/kpi";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  period: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
});

const postSchema = z
  .object({
    requirementId: z.number().int().positive(),
    year: z.number().int().min(2000).max(2100),
    period: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
    actualValue: z.number(),
    whatHappened: z.string().max(5000).optional().nullable(),
    howHappened: z.string().max(5000).optional().nullable(),
    note: z.string().max(5000).optional().nullable(),
    action: z.enum(["draft", "submit"]).default("submit"),
  })
  .strict();

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const userId = parseInt(user.id, 10);
    const items = await getMyRequirements(
      {
        userId,
        role: user.role,
        departmentId: user.departmentId,
        sectionId: user.sectionId,
      },
      params.year,
      params.period
    );
    return NextResponse.json({ year: params.year, period: params.period, items });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = postSchema.parse(await req.json());
    const userId = parseInt(user.id, 10);
    const fillerRole = roleToFillerRole(user.role);

    const requirement = await db.measurementRequirement.findUnique({
      where: { id: body.requirementId },
      select: {
        id: true,
        code: true,
        name: true,
        ownerId: true,
        fillerRole: true,
        frequency: true,
        departmentId: true,
        active: true,
      },
    });

    if (!requirement || !requirement.active) return jsonError("المتطلب غير موجود", 404);
    if (requirement.ownerId !== userId) return jsonError("غير مصرح — هذا المتطلب ليس من مهامك", 403);
    if (
      user.departmentId != null &&
      requirement.departmentId != null &&
      requirement.departmentId !== user.departmentId
    ) {
      return jsonError("غير مصرح — المتطلب خارج إدارتك", 403);
    }
    if (fillerRole && requirement.fillerRole !== fillerRole) {
      return jsonError("دور التعبئة لا يطابق دورك", 403);
    }

    const allowedPeriods = resolvePeriods(requirement.frequency);
    if (!allowedPeriods.includes(body.period as Period)) {
      return jsonError("الفترة لا تتوافق مع دورية المتطلب", 400);
    }

    const existing = await db.measurementPeriod.findUnique({
      where: {
        requirementId_year_period: {
          requirementId: body.requirementId,
          year: body.year,
          period: body.period as Period,
        },
      },
      select: { id: true, approvalStatus: true },
    });

    if (existing && !canFillerEdit(existing.approvalStatus) && user.role !== "SYSTEM_ADMIN") {
      return jsonError(
        existing.approvalStatus === "SUBMITTED" || existing.approvalStatus === "PENDING"
          ? "القياس مقدَّم بانتظار مراجعة الإدارة — لا يمكن تعديله الآن"
          : "لا يمكن تعديل القياس في حالته الحالية",
        400
      );
    }

    // تقديم المدير يتجاوز الاعتماد المبدئي (لا اعتماد ذاتي) → مباشرة بانتظار النهائي
    const skipDeptInitial =
      body.action === "submit" && user.role === "DEPT_MANAGER";
    const nextStatus =
      body.action === "draft" ? "DRAFT" : skipDeptInitial ? "INITIAL_APPROVED" : "SUBMITTED";
    const now = new Date();

    const mp = await upsertMeasurementPeriod({
      requirementId: body.requirementId,
      year: body.year,
      period: body.period as Period,
      actualValue: body.actualValue,
      whatHappened: body.whatHappened ?? null,
      howHappened: body.howHappened ?? null,
      note: body.note ?? null,
      enteredById: userId,
      approvalStatus: nextStatus,
      approvedById: null,
      approvedAt: null,
      initialApprovedById: skipDeptInitial ? userId : null,
      initialApprovedAt: skipDeptInitial ? now : null,
      rejectReason: body.action === "submit" ? null : existing ? undefined : null,
      suggestedWording: body.action === "submit" ? null : existing ? undefined : null,
      reviewFeedback: body.action === "submit" ? null : existing ? undefined : null,
    });

    await recordApprovalEvent({
      measurementPeriodId: mp.id,
      actorId: userId,
      action: body.action === "draft" ? "SAVE_DRAFT" : "SUBMIT",
      payload: skipDeptInitial ? { skipDeptInitial: true } : undefined,
    });

    if (skipDeptInitial) {
      await recordApprovalEvent({
        measurementPeriodId: mp.id,
        actorId: userId,
        action: "INITIAL_APPROVE",
        comment: "تجاوز الاعتماد المبدئي — تقديم مدير الإدارة",
        payload: { skipDeptInitial: true },
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
          body: `قدّمه مدير الإدارة ${user.name}: ${requirement.code} — ${requirement.name}`,
          link: `/approvals?mp=${mp.id}`,
          linkLabel: `فتح القياس ${requirement.code} للاعتماد النهائي`,
          email: true,
        });
      }
    } else if (body.action === "submit" && requirement.departmentId != null) {
      const managers = await db.user.findMany({
        where: {
          role: "DEPT_MANAGER",
          departmentId: requirement.departmentId,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      if (managers.length > 0) {
        await notify({
          userIds: managers.map((m) => m.id),
          type: "APPROVAL_REQUEST",
          title: "قياس بانتظار المراجعة المبدئية",
          body: `${user.name} قدّم قياساً للمتطلب ${requirement.code} — ${requirement.name}`,
          link: `/dept-follow?mp=${mp.id}`,
          linkLabel: `فتح القياس ${requirement.code} للمراجعة`,
          email: true,
        });
      }
    }

    await audit(userId, body.action === "draft" ? "DRAFT_MEASUREMENT" : "SUBMIT_MEASUREMENT", "MeasurementPeriod", mp.id, {
      requirementId: body.requirementId,
      year: body.year,
      period: body.period,
      skipDeptInitial,
    });

    return NextResponse.json({
      measurement: mp,
      skipDeptInitial,
      message: skipDeptInitial
        ? "قُدِّم مباشرة للاعتماد النهائي (بدون اعتماد مبدئي)"
        : undefined,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
