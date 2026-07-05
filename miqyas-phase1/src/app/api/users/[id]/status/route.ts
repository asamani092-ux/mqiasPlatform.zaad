import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireManageUsers } from "@/lib/admin-auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import {
  assertLastAdminGuard,
  assertSelfAdminGuard,
  toggleStatusSchema,
} from "@/lib/user-schemas";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  departmentId: true,
  sectionId: true,
  lastLogin: true,
  department: { select: { id: true, name: true } },
  section: { select: { id: true, name: true, code: true } },
} as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    requireManageUsers(user);

    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return jsonError("معرّف غير صالح", 400);

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return jsonError("المستخدم غير موجود", 404);

    const body = toggleStatusSchema.parse(await req.json());

    assertSelfAdminGuard(user.id, id, { status: body.status });
    await assertLastAdminGuard(id, existing.role, existing.status, { status: body.status });

    const updated = await db.user.update({
      where: { id },
      data: { status: body.status },
      select: userSelect,
    });

    await audit(parseInt(user.id, 10), "TOGGLE_USER_STATUS", "User", id, {
      status: body.status,
      email: existing.email,
    });

    return NextResponse.json({ user: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
