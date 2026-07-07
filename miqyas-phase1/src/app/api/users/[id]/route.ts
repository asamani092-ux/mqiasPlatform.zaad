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
  resolveRoleScope,
  updateUserSchema,
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

export async function PUT(
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

    const body = updateUserSchema.parse(await req.json());
    if (Object.keys(body).length === 0) return jsonError("لا توجد بيانات للتحديث", 400);

    const nextRole = body.role ?? existing.role;
    const nextStatus = body.status ?? existing.status;

    assertSelfAdminGuard(user.id, id, { role: body.role, status: body.status });
    await assertLastAdminGuard(id, existing.role, existing.status, {
      role: body.role,
      status: body.status,
    });

    const scope = await resolveRoleScope(
      nextRole,
      body.departmentId !== undefined ? body.departmentId : existing.departmentId,
      body.sectionId !== undefined ? body.sectionId : existing.sectionId,
    );

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(body.name != null ? { name: body.name } : {}),
        role: nextRole,
        status: nextStatus,
        departmentId: scope.departmentId,
        sectionId: scope.sectionId,
      },
      select: userSelect,
    });

    await audit(parseInt(user.id, 10), "UPDATE_USER", "User", updated.id, {
      role: updated.role,
      status: updated.status,
    });

    return NextResponse.json({ user: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
