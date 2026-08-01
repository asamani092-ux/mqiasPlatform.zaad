import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { jsonError } from "@/lib/api-helpers";
import { hashResetToken } from "@/lib/reset-token";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(200),
});

const SUCCESS_MESSAGE =
  "إذا كان البريد مسجّلاً لدينا، ستصلك رسالة برابط إعادة التعيين خلال دقائق.";

// حد أقصى 3 طلبات استعادة للبريد الواحد خلال الساعة
const RESET_WINDOW_MS = 60 * 60 * 1000;
const RESET_MAX_PER_WINDOW = 3;

export async function POST(req: NextRequest) {
  try {
    const body = forgotPasswordSchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const recentRequests = await db.passwordResetToken.count({
      where: { email, createdAt: { gte: new Date(Date.now() - RESET_WINDOW_MS) } },
    });
    if (recentRequests >= RESET_MAX_PER_WINDOW) {
      // نفس رسالة النجاح — لا نكشف وجود البريد ولا حالة الحد
      return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, status: true },
    });

    if (user && user.status === "ACTIVE") {
      const rawToken = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // يُخزَّن التجزيء فقط — تسريب الجدول لا يكشف الروابط
      await db.passwordResetToken.create({
        data: { email, token: hashResetToken(rawToken), expiresAt },
      });

      const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

      const emailSent = await sendMail(
        user.email,
        "إعادة تعيين كلمة المرور — منصة مِقياس",
        `<p>مرحباً ${user.name}،</p>
         <p>تلقّينا طلباً لإعادة تعيين كلمة المرور. اضغط على الرابط أدناه (صالح لمدة ساعة واحدة):</p>
         <p style="margin:20px 0;"><a href="${resetLink}" style="color:#1a5c3a;font-weight:700;">إعادة تعيين كلمة المرور</a></p>
         <p style="font-size:.85rem;color:#666;">إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>`,
      );

      if (!emailSent) {
        if (process.env.NODE_ENV !== "production") {
          console.log(
            `[forgot-password] SMTP غير مضبوط — رابط الاستعادة لـ ${email}:\n${resetLink}`,
          );
        } else {
          console.warn(`[forgot-password] فشل إرسال بريد الاستعادة لـ ${email} — راجع إعدادات SMTP`);
        }
        return NextResponse.json({
          ok: true,
          message:
            "تم إنشاء رابط الاستعادة. البريد غير مفعّل حالياً — تواصل مع مشرف النظام.",
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
