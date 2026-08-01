import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await db.notification.findMany({
      where: { userId: parseInt(user.id, 10) },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        readAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ notifications });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    await db.notification.updateMany({
      where: { userId: parseInt(user.id, 10), readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
