import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  title: z.string().trim().min(2).max(300),
  notes: z.string().max(5000).optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).optional(),
});

const updateSchema = createSchema.partial().extend({
  id: z.number().int().positive(),
});

export async function GET() {
  try {
    const user = await requireUser();
    if (!can.viewAuditOffice(user)) return jsonError("غير مصرح", 403);

    const plans = await db.auditYearPlan.findMany({
      orderBy: { year: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { engagements: true } },
      },
    });

    return NextResponse.json({
      plans,
      canManage: can.manageAuditPlan(user),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageAuditPlan(user)) return jsonError("غير مصرح", 403);

    const body = createSchema.parse(await req.json());
    const plan = await db.auditYearPlan.create({
      data: {
        year: body.year,
        title: body.title,
        notes: body.notes ?? null,
        status: body.status ?? "DRAFT",
        createdById: parseInt(user.id, 10),
      },
    });

    await audit(parseInt(user.id, 10), "CREATE_AUDIT_PLAN", "AuditYearPlan", plan.id, {
      year: plan.year,
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageAuditPlan(user)) return jsonError("غير مصرح", 403);

    const body = updateSchema.parse(await req.json());
    const existing = await db.auditYearPlan.findUnique({ where: { id: body.id } });
    if (!existing) return jsonError("الخطة غير موجودة", 404);

    const plan = await db.auditYearPlan.update({
      where: { id: body.id },
      data: {
        ...(body.year != null ? { year: body.year } : {}),
        ...(body.title != null ? { title: body.title } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.status != null ? { status: body.status } : {}),
      },
    });

    await audit(parseInt(user.id, 10), "UPDATE_AUDIT_PLAN", "AuditYearPlan", plan.id, body);

    return NextResponse.json({ plan });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
