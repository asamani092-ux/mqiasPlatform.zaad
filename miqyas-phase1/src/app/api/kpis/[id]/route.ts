import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireManageKpis } from "@/lib/admin-auth";
import { kpiUpdateSchema } from "@/lib/kpi-schemas";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    requireManageKpis(user);

    const id = parseInt(params.id, 10);
    const kpi = await db.kpi.findUnique({
      where: { id },
      include: {
        department: true,
        section: true,
        owner: { select: { id: true, name: true, email: true } },
        strategicGoal: true,
        operationalGoal: true,
        targets: { orderBy: [{ year: "desc" }, { period: "asc" }] },
      },
    });

    if (!kpi) return jsonError("المؤشر غير موجود", 404);
    return NextResponse.json({ kpi });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    requireManageKpis(user);

    const id = parseInt(params.id, 10);
    const body = kpiUpdateSchema.parse(await req.json());

    const kpi = await db.kpi.update({ where: { id }, data: body });
    await audit(parseInt(user.id, 10), "UPDATE_KPI", "Kpi", kpi.id, { code: kpi.code });

    return NextResponse.json({ kpi });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    requireManageKpis(user);

    const id = parseInt(params.id, 10);
    const kpi = await db.kpi.update({ where: { id }, data: { active: false } });
    await audit(parseInt(user.id, 10), "DELETE_KPI", "Kpi", kpi.id, { code: kpi.code, soft: true });

    return NextResponse.json({ kpi });
  } catch (e) {
    return handleApiError(e);
  }
}
