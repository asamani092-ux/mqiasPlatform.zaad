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
  const pass = process.env.ADMIN_PASSWORD?.trim();
  if (!pass) return jsonError("ADMIN_PASSWORD غير معرّف في البيئة", 400);

  const passwordHash = await bcrypt.hash(pass, 12);
  let existing = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true },
  });
  if (!existing) {
    const admins = await db.user.findMany({
      where: { role: "SYSTEM_ADMIN" },
      select: { id: true, email: true },
      orderBy: { id: "asc" },
    });
    if (admins.length === 1) existing = admins[0];
  }

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
      data: { passwordHash, status: "ACTIVE", role: "SYSTEM_ADMIN" },
    });
  }

  await db.loginAttempt.deleteMany({
    where: { email: { equals: existing?.email ?? email, mode: "insensitive" } },
  });

  return NextResponse.json({ ok: true, email: existing?.email ?? email, created: !existing });
}
