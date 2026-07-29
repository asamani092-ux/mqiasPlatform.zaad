import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const patchSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    if (!can.manageStructure(user) && !can.manageUsers(user)) {
      return jsonError("غير مصرح", 403);
    }

    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return jsonError("معرّف غير صالح", 400);

    const body = patchSchema.parse(await req.json());

    const existing = await db.department.findUnique({ where: { id } });
    if (!existing) return jsonError("الإدارة غير موجودة", 404);

    const updated = await db.department.update({
      where: { id },
      data: { name: body.name },
      select: { id: true, deptNo: true, name: true, color: true },
    });

    await audit(parseInt(user.id, 10), "UPDATE_DEPARTMENT", "Department", id, {
      name: body.name,
    });

    return NextResponse.json({ department: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
