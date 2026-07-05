import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireManageUsers } from "@/lib/admin-auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { resetPasswordSchema } from "@/lib/user-schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    requireManageUsers(user);

    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return jsonError("معرّف غير صالح", 400);

    const existing = await db.user.findUnique({ where: { id }, select: { id: true, email: true } });
    if (!existing) return jsonError("المستخدم غير موجود", 404);

    const body = resetPasswordSchema.parse(await req.json());
    const passwordHash = await bcrypt.hash(body.newPassword, 12);

    await db.user.update({
      where: { id },
      data: { passwordHash },
    });

    await audit(parseInt(user.id, 10), "RESET_PASSWORD", "User", id, { email: existing.email });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
