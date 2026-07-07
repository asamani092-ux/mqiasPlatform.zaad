import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { CHART_COLORS } from "@/lib/chart-colors";

function buildHtml(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:${CHART_COLORS.background};font-family:'Tajawal',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CHART_COLORS.background};padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:${CHART_COLORS.surface};border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">
        <tr>
          <td style="background:${CHART_COLORS.primary};padding:20px 28px;color:${CHART_COLORS.surface};">
            <div style="font-size:1.25rem;font-weight:800;">منصة مِقياس</div>
            <div style="font-size:.78rem;opacity:.85;margin-top:4px;">جمعية الزاد — قياس الأداء المؤسسي</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;color:${CHART_COLORS.foreground};">
            <h2 style="margin:0 0 12px;font-size:1.05rem;color:${CHART_COLORS.primary};">${subject}</h2>
            <div style="font-size:.88rem;line-height:1.7;color:${CHART_COLORS.brandGray};">${body}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;background:${CHART_COLORS.surfaceMuted};font-size:.72rem;color:${CHART_COLORS.brandGray};text-align:center;">
            هذه رسالة آلية من منصة مِقياس — لا ترد على هذا البريد
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || "smtp.office365.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpFrom = process.env.SMTP_FROM || smtpUser || "miqyas@zad.org.sa";

  if (!smtpUser || !smtpPass) {
    try {
      await db.emailLog.create({
        data: { toEmail: to, subject, status: "FAILED", error: "SMTP غير مضبوط" },
      });
    } catch {
      /* تجاهل */
    }
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { ciphers: "TLSv1.2", minVersion: "TLSv1.2" },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html: buildHtml(subject, html),
    });

    await db.emailLog.create({
      data: { toEmail: to, subject, status: "SENT" },
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير معروف";
    try {
      await db.emailLog.create({
        data: { toEmail: to, subject, status: "FAILED", error: message },
      });
    } catch {
      /* تجاهل */
    }
    return false;
  }
}
