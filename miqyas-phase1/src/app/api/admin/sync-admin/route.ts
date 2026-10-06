import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** مزامنة كلمة مرور المشرف من متغيرات البيئة وإلغاء قفل المحاولات */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return jsonError("غير مصرح", 401);

  const email = (process.env.ADMIN_EMAIL || "admin@zad.org.sa").trim().toLowerCase();
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return jsonError("ADMIN_PASSWORD غير معرّف في البيئة", 400);

  const passwordHash = await bcrypt.hash(pass, 12);
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });

  if (!existing) {
    await db.user.create({
      data: {
        name: "مشرف النظام",
        email,
        passwordHash,
        role: "SYSTEM_ADMIN",
        status: "ACTIVE",
      },
    });
  } else {
    await db.user.update({
      where: { id: existing.id },
      data: { passwordHash, status: "ACTIVE" },
    });
  }

  await db.loginAttempt.deleteMany({ where: { email } });

  return NextResponse.json({ ok: true, email, created: !existing });
}
