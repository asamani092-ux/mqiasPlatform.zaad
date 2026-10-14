import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().trim().min(2).max(300),
  scheduledAt: z.string().min(1),
  location: z.string().max(300).optional().nullable(),
  agenda: z.string().max(8000).optional().nullable(),
  status: z.enum(["SCHEDULED", "HELD", "CANCELLED"]).optional(),
});

const updateSchema = createSchema.partial().extend({ id: z.number().int().positive() });

export async function GET() {
  try {
    const user = await requireUser();
    if (!can.viewCommittee(user)) return jsonError("غير مصرح", 403);
    const meetings = await db.committeeMeeting.findMany({
      orderBy: { scheduledAt: "desc" },
      take: 200,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { minutes: true, decisions: true } },
      },
    });
    return NextResponse.json({ meetings, canManage: can.manageCommittee(user) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageCommittee(user)) return jsonError("غير مصرح", 403);
    const body = createSchema.parse(await req.json());
    const meeting = await db.committeeMeeting.create({
      data: {
        title: body.title,
        scheduledAt: new Date(body.scheduledAt),
        location: body.location ?? null,
        agenda: body.agenda ?? null,
        status: body.status ?? "SCHEDULED",
        createdById: parseInt(user.id, 10),
      },
    });
    await audit(parseInt(user.id, 10), "CREATE_COMMITTEE_MEETING", "CommitteeMeeting", meeting.id);
    return NextResponse.json({ meeting }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageCommittee(user)) return jsonError("غير مصرح", 403);
    const body = updateSchema.parse(await req.json());
    const existing = await db.committeeMeeting.findUnique({ where: { id: body.id } });
    if (!existing) return jsonError("الاجتماع غير موجود", 404);
    const meeting = await db.committeeMeeting.update({
      where: { id: body.id },
      data: {
        ...(body.title != null ? { title: body.title } : {}),
        ...(body.scheduledAt != null ? { scheduledAt: new Date(body.scheduledAt) } : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.agenda !== undefined ? { agenda: body.agenda } : {}),
        ...(body.status != null ? { status: body.status } : {}),
      },
    });
    await audit(parseInt(user.id, 10), "UPDATE_COMMITTEE_MEETING", "CommitteeMeeting", meeting.id);
    return NextResponse.json({ meeting });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
