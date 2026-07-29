import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { jsonError } from "@/lib/api-helpers";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(200),
});

const SUCCESS_MESSAGE =
  "إذا كان البريد مسجّلاً لدينا، ستصلك رسالة برابط إعادة التعيين خلال دقائق.";

export async function POST(req: NextRequest) {
  try {
    const body = forgotPasswordSchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, status: true },
    });

    if (user && user.status === "ACTIVE") {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.passwordResetToken.create({
        data: { email, token, expiresAt },
      });

      const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetLink = `${appUrl}/reset-password?token=${token}`;

      const emailSent = await sendMail(
        user.email,
        "إعادة تعيين كلمة المرور — منصة مِقياس",
        `<p>مرحباً ${user.name}،</p>
         <p>تلقّينا طلباً لإعادة تعيين كلمة المرور. اضغط على الرابط أدناه (صالح لمدة ساعة واحدة):</p>
         <p style="margin:20px 0;"><a href="${resetLink}" style="color:#1a5c3a;font-weight:700;">إعادة تعيين كلمة المرور</a></p>
         <p style="font-size:.85rem;color:#666;">إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>`,
      );

      if (!emailSent) {
        console.log(
          `[forgot-password] SMTP غير مضبوط — رابط الاستعادة لـ ${email}:\n${resetLink}`,
        );
        return NextResponse.json({
          ok: true,
          message:
            "تم إنشاء رابط الاستعادة. البريد غير مفعّل حالياً — تواصل مع مشرف النظام. (رابط تجريبي في سجل الخادم)",
        });
      }
    }

    return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بريد إلكتروني غير صالح", 400);
    console.error(e);
    return jsonError("خطأ داخلي", 500);
  }
}
