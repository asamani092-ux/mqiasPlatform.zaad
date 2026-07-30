import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { getApprovalDelegationFlags } from "@/lib/approval-settings";
import { syncKpiEntriesFromMeasurement } from "@/lib/measurement-sync";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const postSchema = z
  .object({
    measurementPeriodId: z.number().int().positive().optional(),
    entryId: z.number().int().positive().optional(),
    action: z.enum(["approve", "reject"]),
    rejectReason: z.string().min(3).max(2000).optional(),
    comment: z.string().max(2000).optional(),
  })
  .strict()
  .refine((b) => b.measurementPeriodId != null || b.entryId != null, {
    message: "measurementPeriodId or entryId required",
  });

type Flags = Awaited<ReturnType<typeof getApprovalDelegationFlags>>;

function canApproveScope(
  user: { role: string; sectionId: number | null; departmentId: number | null },
  flags: Flags,
  requirement: { sectionId: number | null; departmentId: number | null },
) {
  if (user.role === "SYSTEM_ADMIN") return true;
  if (user.role === "SECTION_HEAD") {
    return (
      flags.sectionHeadDelegation &&
      requirement.sectionId != null &&
      requirement.sectionId === user.sectionId
    );
  }
  if (user.role === "DEPT_MANAGER") {
    return (
      flags.deptManagerDelegation &&
      requirement.departmentId != null &&
      requirement.departmentId === user.departmentId
    );
  }
  return false;
}

async function resolveMeasurementPeriodId(body: {
  measurementPeriodId?: number;
  entryId?: number;
}): Promise<number | null> {
  if (body.measurementPeriodId != null) return body.measurementPeriodId;

  if (body.entryId == null) return null;
  const entry = await db.kpiEntry.findUnique({
    where: { id: body.entryId },
    include: { kpi: { select: { requirementId: true } } },
  });
  if (!entry?.kpi.requirementId) return null;

  const mp = await db.measurementPeriod.findUnique({
    where: {
      requirementId_year_period: {
        requirementId: entry.kpi.requirementId,
        year: entry.year,
        period: entry.period,
      },
    },
    select: { id: true },
  });
  return mp?.id ?? null;
}

export async function GET() {
  try {
    const user = await requireUser();
    const flags = await getApprovalDelegationFlags();

    if (!can.approveEntries(user, flags)) {
      return jsonError("غير مصرح", 403);
    }

    const where: Record<string, unknown> = { approvalStatus: "PENDING" };

    if (user.role === "SECTION_HEAD") {
      where.requirement = { sectionId: user.sectionId ?? -1 };
    } else if (user.role === "DEPT_MANAGER") {
      where.requirement = { departmentId: user.departmentId ?? -1 };
    }

    const periods = await db.measurementPeriod.findMany({
      where,
      include: {
        requirement: {
          select: {
            code: true,
            name: true,
            unit: true,
            sectionId: true,
            departmentId: true,
            requiredData: true,
            owner: { select: { id: true, name: true, email: true } },
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
      entries: periods.map((mp) => ({
        id: mp.id,
        measurementPeriodId: mp.id,
        year: mp.year,
        period: mp.period,
        actualValue: mp.actualValue,
        achievementPct: null as number | null,
        deviationValue: null as number | null,
        deviationPct: null as number | null,
        status: "NO_DATA" as const,
        whatHappened: mp.whatHappened,
        howHappened: mp.howHappened,
        approvalStatus: mp.approvalStatus,
        createdAt: mp.createdAt,
        kpi: {
          code: mp.requirement.code,
          name: mp.requirement.name,
          unit: mp.requirement.unit,
          sectionId: mp.requirement.sectionId,
          requiredData: mp.requirement.requiredData,
        },
        owner: mp.requirement.owner,
        employee: mp.enteredBy,
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
    const flags = await getApprovalDelegationFlags();

    if (!can.approveEntries(user, flags)) {
      return jsonError("غير مصرح", 403);
    }

    const body = postSchema.parse(await req.json());

    if (body.action === "reject" && !body.rejectReason) {
      return jsonError("سبب الرفض مطلوب", 400);
    }

    const measurementPeriodId = await resolveMeasurementPeriodId(body);
    if (measurementPeriodId == null) {
      return jsonError("فترة القياس غير موجودة", 404);
    }

    const mp = await db.measurementPeriod.findUnique({
      where: { id: measurementPeriodId },
      include: {
        requirement: {
          select: {
            code: true,
            name: true,
            sectionId: true,
            departmentId: true,
          },
        },
        enteredBy: { select: { id: true, name: true } },
      },
    });

    if (!mp) return jsonError("فترة القياس غير موجودة", 404);
    if (mp.approvalStatus !== "PENDING") {
      return jsonError("القياس ليس بانتظار الاعتماد", 400);
    }

    if (!canApproveScope(user, flags, mp.requirement)) {
      return jsonError("غير مصرح", 403);
    }

    const approveNote = body.comment?.trim() || null;

    const updated =
      body.action === "approve"
        ? await db.measurementPeriod.update({
            where: { id: measurementPeriodId },
            data: {
              approvalStatus: "APPROVED",
              approvedById: userId,
              approvedAt: new Date(),
              rejectReason: null,
              ...(approveNote ? { note: approveNote } : {}),
            },
          })
        : await db.measurementPeriod.update({
            where: { id: measurementPeriodId },
            data: {
              approvalStatus: "REJECTED",
              approvedById: userId,
              approvedAt: new Date(),
              rejectReason: body.rejectReason!,
            },
          });

    await syncKpiEntriesFromMeasurement(measurementPeriodId);

    const code = mp.requirement.code;
    const name = mp.requirement.name;
    const approveBody = approveNote
      ? `تم اعتماد قياس المتطلب ${code} — ${name}. ملاحظة: ${approveNote}`
      : `تم اعتماد قياس المتطلب ${code} — ${name}`;

    await notify({
      userIds: [mp.enteredById],
      type: "APPROVAL_RESULT",
      title: body.action === "approve" ? "تم اعتماد قياسك" : "تم رفض قياسك",
      body:
        body.action === "approve"
          ? approveBody
          : `تم رفض قياس المتطلب ${code}: ${body.rejectReason}`,
      link: "/my",
      email: true,
    });

    await audit(
      userId,
      body.action === "approve" ? "APPROVE_ENTRY" : "REJECT_ENTRY",
      "MeasurementPeriod",
      mp.id,
      { action: body.action },
    );

    return NextResponse.json({
      measurementPeriod: updated,
      entry: updated,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
