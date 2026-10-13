import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  planId: z.number().int().positive(),
  title: z.string().trim().min(2).max(300),
  objective: z.string().max(5000).optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  sectionId: z.number().int().positive().optional().nullable(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "REPORTING", "CLOSED"]).optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial().extend({
  id: z.number().int().positive(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.viewAuditOffice(user)) return jsonError("غير مصرح", 403);

    const planIdRaw = req.nextUrl.searchParams.get("planId");
    const planId = planIdRaw ? parseInt(planIdRaw, 10) : null;
    const where = planId != null && !Number.isNaN(planId) ? { planId } : {};

    const engagements = await db.auditEngagement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        plan: { select: { id: true, year: true, title: true } },
        department: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { findings: true, workingPapers: true, reports: true } },
      },
    });

    const plans = await db.auditYearPlan.findMany({
      orderBy: { year: "desc" },
      select: { id: true, year: true, title: true, status: true },
    });

    const departments = await db.department.findMany({
      orderBy: { deptNo: "asc" },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      engagements,
      plans,
      departments,
      canManage: can.manageAuditEngagements(user),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageAuditEngagements(user)) return jsonError("غير مصرح", 403);

    const body = createSchema.parse(await req.json());
    const plan = await db.auditYearPlan.findUnique({ where: { id: body.planId } });
    if (!plan) return jsonError("الخطة غير موجودة", 404);

    const engagement = await db.auditEngagement.create({
      data: {
        planId: body.planId,
        title: body.title,
        objective: body.objective ?? null,
        departmentId: body.departmentId ?? null,
        sectionId: body.sectionId ?? null,
        status: body.status ?? "PLANNED",
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        createdById: parseInt(user.id, 10),
      },
    });

    await audit(parseInt(user.id, 10), "CREATE_AUDIT_ENGAGEMENT", "AuditEngagement", engagement.id, {
      title: engagement.title,
    });

    return NextResponse.json({ engagement }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageAuditEngagements(user)) return jsonError("غير مصرح", 403);

    const body = updateSchema.parse(await req.json());
    const existing = await db.auditEngagement.findUnique({ where: { id: body.id } });
    if (!existing) return jsonError("المهمة غير موجودة", 404);

    const engagement = await db.auditEngagement.update({
      where: { id: body.id },
      data: {
        ...(body.planId != null ? { planId: body.planId } : {}),
        ...(body.title != null ? { title: body.title } : {}),
        ...(body.objective !== undefined ? { objective: body.objective } : {}),
        ...(body.departmentId !== undefined ? { departmentId: body.departmentId } : {}),
        ...(body.sectionId !== undefined ? { sectionId: body.sectionId } : {}),
        ...(body.status != null ? { status: body.status } : {}),
        ...(body.startsAt !== undefined
          ? { startsAt: body.startsAt ? new Date(body.startsAt) : null }
          : {}),
        ...(body.endsAt !== undefined
          ? { endsAt: body.endsAt ? new Date(body.endsAt) : null }
          : {}),
      },
    });

    await audit(parseInt(user.id, 10), "UPDATE_AUDIT_ENGAGEMENT", "AuditEngagement", engagement.id, body);

    return NextResponse.json({ engagement });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
