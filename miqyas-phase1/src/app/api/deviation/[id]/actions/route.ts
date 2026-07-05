import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { scopedKpiWhere } from "@/lib/analytics";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  description: z.string().min(3).max(2000),
  responsibleId: z.number().int().optional().nullable(),
  responsibleName: z.string().max(200).optional().nullable(),
  dueDate: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    if (!can.manageDeviation(user)) return jsonError("غير مصرح", 403);

    const cardId = parseInt(params.id, 10);
    const card = await db.deviationCard.findFirst({
      where: { id: cardId, kpi: scopedKpiWhere(user) },
    });
    if (!card) return jsonError("البطاقة غير موجودة", 404);

    const body = actionSchema.parse(await req.json());
    const action = await db.correctiveAction.create({
      data: {
        deviationCardId: cardId,
        description: body.description,
        responsibleId: body.responsibleId,
        responsibleName: body.responsibleName,
        dueDate: new Date(body.dueDate),
      },
    });

    await audit(parseInt(user.id, 10), "CREATE_CORRECTIVE_ACTION", "CorrectiveAction", action.id);
    return NextResponse.json({ action }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
