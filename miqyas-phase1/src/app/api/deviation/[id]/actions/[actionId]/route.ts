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
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "LATE"]),
  completedAt: z.string().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; actionId: string } },
) {
  try {
    const user = await requireUser();
    if (!can.manageDeviation(user)) return jsonError("غير مصرح", 403);

    const cardId = parseInt(params.id, 10);
    const actionId = parseInt(params.actionId, 10);
    const body = updateSchema.parse(await req.json());

    const action = await db.correctiveAction.findFirst({
      where: {
        id: actionId,
        card: { id: cardId, kpi: scopedKpiWhere(user) },
      },
    });
    if (!action) return jsonError("الإجراء غير موجود", 404);

    const updated = await db.correctiveAction.update({
      where: { id: actionId },
      data: {
        status: body.status,
        completedAt: body.completedAt ? new Date(body.completedAt) : body.status === "DONE" ? new Date() : null,
      },
    });

    await audit(parseInt(user.id, 10), "UPDATE_CORRECTIVE_ACTION", "CorrectiveAction", actionId, body);
    return NextResponse.json({ action: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
