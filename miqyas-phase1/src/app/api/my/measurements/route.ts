import { NextResponse } from "next/server";
import { z } from "zod";
import type { Period } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { getApprovalDelegationFlags } from "@/lib/approval-settings";
import { getMyRequirements } from "@/lib/my-measurements";
import { upsertMeasurementPeriod } from "@/lib/measurement-sync";
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
  })
  .strict();

/** قائمة متطلبات القياس للمستخدم الحالي */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const userId = parseInt(user.id, 10);
    const items = await getMyRequirements(userId, params.year, params.period);
    return NextResponse.json({ year: params.year, period: params.period, items });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}

/** إدخال قياس عبر MeasurementPeriod ثم مزامنة المؤشرات */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = postSchema.parse(await req.json());
    const userId = parseInt(user.id, 10);

    const requirement = await db.measurementRequirement.findUnique({
      where: { id: body.requirementId },
      select: {
        id: true,
        code: true,
        name: true,
        ownerId: true,
        frequency: true,
        sectionId: true,
        departmentId: true,
        active: true,
      },
    });

    if (!requirement || !requirement.active) return jsonError("المتطلب غير موجود", 404);
    if (requirement.ownerId !== userId) return jsonError("غير مصرح — هذا المتطلب ليس من مهامك", 403);

    const allowedPeriods = resolvePeriods(requirement.frequency);
    if (!allowedPeriods.includes(body.period as Period)) {
      return jsonError("الفترة لا تتوافق مع دورية المتطلب", 400);
    }

    const mp = await upsertMeasurementPeriod({
      requirementId: body.requirementId,
      year: body.year,
      period: body.period as Period,
      actualValue: body.actualValue,
      whatHappened: body.whatHappened ?? null,
      howHappened: body.howHappened ?? null,
      note: body.note ?? null,
      enteredById: userId,
      approvalStatus: "PENDING",
      approvedById: null,
      approvedAt: null,
      rejectReason: null,
    });

    const flags = await getApprovalDelegationFlags();
    const approverIds: number[] = [];

    const admins = await db.user.findMany({
      where: { role: "SYSTEM_ADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    approverIds.push(...admins.map((a) => a.id));

    // نفس منطق can.approveEntries: تفويض رؤساء الأقسام / مديري الإدارات حسب الإعدادات
    if (flags.sectionHeadDelegation && requirement.sectionId != null) {
      const heads = await db.user.findMany({
        where: { role: "SECTION_HEAD", sectionId: requirement.sectionId, status: "ACTIVE" },
        select: { id: true },
      });
      for (const h of heads) {
        if (!approverIds.includes(h.id)) approverIds.push(h.id);
      }
    }

    if (flags.deptManagerDelegation && requirement.departmentId != null) {
      const managers = await db.user.findMany({
        where: { role: "DEPT_MANAGER", departmentId: requirement.departmentId, status: "ACTIVE" },
        select: { id: true },
      });
      for (const m of managers) {
        if (!approverIds.includes(m.id)) approverIds.push(m.id);
      }
    }

    await notify({
      userIds: approverIds,
      type: "APPROVAL_REQUEST",
      title: "طلب اعتماد قياس جديد",
      body: `${user.name} أرسل قياسًا للمتطلب ${requirement.code} — ${requirement.name}`,
      link: "/approvals",
      email: true,
    });

    await audit(userId, "SUBMIT_MEASUREMENT", "MeasurementPeriod", mp.id, {
      requirementId: body.requirementId,
      year: body.year,
      period: body.period,
    });

    return NextResponse.json({ measurement: mp });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
