import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireManageKpis } from "@/lib/admin-auth";
import { sendMail } from "@/lib/mailer";
import { getSetting } from "@/lib/settings";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const bodySchema = z.object({
  to: z.string().trim().email().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    requireManageKpis(user);

    const body = bodySchema.parse(await req.json().catch(() => ({})));
    const to = body.to || user.email;
    if (!to) return jsonError("لا يوجد بريد مستلم", 400);

    const fromSetting = (await getSetting("notify_from_email")).trim();
    const from = fromSetting || process.env.SMTP_FROM || process.env.SMTP_USER || "miqyas@zad.org.sa";

    const sent = await sendMail(
      to,
      "رسالة تجريبية — منصة مِقياس",
      `<p>هذه رسالة تجريبية للتحقق من إعدادات البريد.</p>
       <p>بريد المرسل الحالي: <strong>${from}</strong></p>
       <p>إن وصلتك هذه الرسالة فالإرسال يعمل بشكل سليم.</p>`,
    );

    await audit(parseInt(user.id, 10), "TEST_EMAIL", "SystemSetting", undefined, { to, from, sent });

    if (!sent) {
      // آخر خطأ مسجَّل لتوضيح السبب (SMTP غير مضبوط / رفض الخادم)
      const lastLog = await db.emailLog.findFirst({
        where: { toEmail: to, status: "FAILED" },
        orderBy: { createdAt: "desc" },
        select: { error: true },
      });
      return NextResponse.json({
        sent: false,
        from,
        error: lastLog?.error || "فشل الإرسال",
        hint: "بيانات SMTP (المضيف/المستخدم/كلمة المرور) تُضبط في .env على الخادم — الربط لاحقاً. إشعارات المنصة الداخلية تعمل بشكل مستقل.",
      });
    }

    return NextResponse.json({ sent: true, from, to });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بريد غير صالح", 400);
    return handleApiError(e);
  }
}
