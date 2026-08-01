import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api-helpers";
import { resetPasswordSchema } from "@/lib/user-schemas";
import { hashResetToken } from "@/lib/reset-token";

const resetRequestSchema = resetPasswordSchema.extend({
  token: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = resetRequestSchema.parse(await req.json());

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: hashResetToken(body.token) },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return jsonError("رابط الاستعادة غير صالح أو منتهي الصلاحية", 400);
    }

    const user = await db.user.findUnique({
      where: { email: resetToken.email },
      select: { id: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return jsonError("الحساب غير موجود أو غير نشط", 400);
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 12);

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    console.error(e);
    return jsonError("خطأ داخلي", 500);
  }
}
