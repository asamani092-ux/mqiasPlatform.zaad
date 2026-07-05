import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { scopedKpiWhere } from "@/lib/analytics";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
  reasons: z.string().min(3).max(5000).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    const id = parseInt(params.id, 10);
    const card = await db.deviationCard.findFirst({
      where: { id, kpi: scopedKpiWhere(user) },
      include: {
        kpi: true,
        actions: { include: { responsible: { select: { name: true } } } },
      },
    });
    if (!card) return jsonError("غير موجود", 404);
    return NextResponse.json({ card });
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
    if (!can.manageDeviation(user)) return jsonError("غير مصرح", 403);

    const id = parseInt(params.id, 10);
    const body = updateSchema.parse(await req.json());

    const existing = await db.deviationCard.findFirst({
      where: { id, kpi: scopedKpiWhere(user) },
      include: { actions: true },
    });
    if (!existing) return jsonError("غير موجود", 403);

    let closedAt = existing.closedAt;
    if (body.status === "CLOSED") {
      const allDone = existing.actions.every((a) => a.status === "DONE");
      if (!allDone && existing.actions.length > 0) {
        return jsonError("يجب إغلاق جميع الإجراءات التصحيحية أولاً", 400);
      }
      closedAt = new Date();
    }

    const card = await db.deviationCard.update({
      where: { id },
      data: {
        status: body.status,
        reasons: body.reasons,
        closedAt,
      },
    });

    await audit(parseInt(user.id, 10), "UPDATE_DEVIATION_CARD", "DeviationCard", card.id, body);
    return NextResponse.json({ card });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
