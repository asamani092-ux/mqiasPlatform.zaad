import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  meetingId: z.number().int().positive(),
  body: z.string().trim().min(2).max(20000),
});

export async function GET() {
  try {
    const user = await requireUser();
    if (!can.viewCommittee(user)) return jsonError("غير مصرح", 403);
    const [minutes, meetings] = await Promise.all([
      db.committeeMinute.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          meeting: { select: { id: true, title: true, scheduledAt: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      db.committeeMeeting.findMany({
        orderBy: { scheduledAt: "desc" },
        select: { id: true, title: true, scheduledAt: true },
        take: 100,
      }),
    ]);
    return NextResponse.json({ minutes, meetings, canManage: can.manageCommittee(user) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageCommittee(user)) return jsonError("غير مصرح", 403);
    const body = createSchema.parse(await req.json());
    const meeting = await db.committeeMeeting.findUnique({ where: { id: body.meetingId } });
    if (!meeting) return jsonError("الاجتماع غير موجود", 404);
    const minute = await db.committeeMinute.create({
      data: {
        meetingId: body.meetingId,
        body: body.body,
        createdById: parseInt(user.id, 10),
      },
    });
    await audit(parseInt(user.id, 10), "CREATE_COMMITTEE_MINUTE", "CommitteeMinute", minute.id);
    return NextResponse.json({ minute }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
