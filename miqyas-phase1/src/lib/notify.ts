import type { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

type NotifyParams = {
  userIds: number[];
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  email?: boolean;
};

export async function notify(params: NotifyParams): Promise<void> {
  const { userIds, type, title, body, link, email } = params;
  if (userIds.length === 0) return;

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  await db.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      link,
    })),
  });

  if (!email) return;

  const users = await db.user.findMany({
    where: { id: { in: userIds }, status: "ACTIVE" },
    select: { id: true, email: true, name: true },
  });

  const fullLink = link ? `${appUrl}${link.startsWith("/") ? link : `/${link}`}` : appUrl;

  await Promise.all(
    users.map((u) =>
      sendMail(
        u.email,
        title,
        `<p>مرحبًا ${u.name}،</p><p>${body}</p>${
          link ? `<p><a href="${fullLink}" style="color:#8b1a2a;font-weight:700;">عرض التفاصيل</a></p>` : ""
        }`,
      ),
    ),
  );
}
