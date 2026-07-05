import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { getSetting } from "@/lib/settings";
import { deviationPct } from "@/lib/kpi";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const postSchema = z
  .object({
    entryId: z.number().int().positive(),
    action: z.enum(["approve", "reject"]),
    rejectReason: z.string().min(3).max(2000).optional(),
  })
  .strict();

export async function GET() {
  try {
    const user = await requireUser();
    const delegationOn = (await getSetting("section_head_can_approve")) === "1";

    if (!can.approveEntries(user, delegationOn)) {
      return jsonError("غير مصرح", 403);
    }

    let where: Record<string, unknown> = { approvalStatus: "PENDING" };

    if (user.role === "SECTION_HEAD") {
      where = {
        approvalStatus: "PENDING",
        kpi: { sectionId: user.sectionId ?? -1 },
      };
    }

    const entries = await db.kpiEntry.findMany({
      where,
      include: {
        kpi: {
          select: {
            code: true,
            name: true,
            unit: true,
            sectionId: true,
            requiredData: true,
          },
        },
        enteredBy: { select: { id: true, name: true, email: true } },
        evidences: {
          select: { id: true, fileName: true, mimeType: true, sizeBytes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e.id,
        year: e.year,
        period: e.period,
        actualValue: e.actualValue,
        achievementPct: e.achievementPct,
        deviationValue: e.deviationValue,
        deviationPct: deviationPct(e.achievementPct),
        status: e.status,
        whatHappened: e.whatHappened,
        howHappened: e.howHappened,
        approvalStatus: e.approvalStatus,
        createdAt: e.createdAt,
        kpi: e.kpi,
        employee: e.enteredBy,
        evidences: e.evidences,
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
    const delegationOn = (await getSetting("section_head_can_approve")) === "1";

    if (!can.approveEntries(user, delegationOn)) {
      return jsonError("غير مصرح", 403);
    }

    const body = postSchema.parse(await req.json());

    if (body.action === "reject" && !body.rejectReason) {
      return jsonError("سبب الرفض مطلوب", 400);
    }

    const entry = await db.kpiEntry.findUnique({
      where: { id: body.entryId },
      include: {
        kpi: { select: { code: true, name: true, sectionId: true } },
        enteredBy: { select: { id: true, name: true } },
      },
    });

    if (!entry) return jsonError("الإدخال غير موجود", 404);
    if (entry.approvalStatus !== "PENDING") {
      return jsonError("الإدخال ليس بانتظار الاعتماد", 400);
    }

    if (user.role === "SECTION_HEAD") {
      if (!delegationOn || entry.kpi.sectionId !== user.sectionId) {
        return jsonError("غير مصرح", 403);
      }
    }

    const updated =
      body.action === "approve"
        ? await db.kpiEntry.update({
            where: { id: body.entryId },
            data: {
              approvalStatus: "APPROVED",
              approvedById: userId,
              approvedAt: new Date(),
              rejectReason: null,
            },
          })
        : await db.kpiEntry.update({
            where: { id: body.entryId },
            data: {
              approvalStatus: "REJECTED",
              approvedById: userId,
              approvedAt: new Date(),
              rejectReason: body.rejectReason!,
            },
          });

    await notify({
      userIds: [entry.enteredById],
      type: "APPROVAL_RESULT",
      title: body.action === "approve" ? "تم اعتماد قياسك" : "تم رفض قياسك",
      body:
        body.action === "approve"
          ? `تم اعتماد قياس المؤشر ${entry.kpi.code} — ${entry.kpi.name}`
          : `تم رفض قياس المؤشر ${entry.kpi.code}: ${body.rejectReason}`,
      link: "/my",
      email: true,
    });

    await audit(
      userId,
      body.action === "approve" ? "APPROVE_ENTRY" : "REJECT_ENTRY",
      "KpiEntry",
      entry.id,
      { action: body.action },
    );

    return NextResponse.json({ entry: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
