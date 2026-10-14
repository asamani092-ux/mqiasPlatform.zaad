import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  meetingId: z.number().int().positive().optional().nullable(),
  title: z.string().trim().min(2).max(300),
  recommendation: z.string().max(8000).optional().nullable(),
  ownerName: z.string().max(200).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE"]).optional(),
});

const updateSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE"]).optional(),
  ownerName: z.string().max(200).optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const user = await requireUser();
    if (!can.viewCommittee(user)) return jsonError("غير مصرح", 403);
    const [decisions, meetings] = await Promise.all([
      db.committeeDecision.findMany({
        orderBy: { createdAt: "desc" },
        take: 300,
        include: {
          meeting: { select: { id: true, title: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      db.committeeMeeting.findMany({
        orderBy: { scheduledAt: "desc" },
        select: { id: true, title: true },
        take: 100,
      }),
    ]);
    return NextResponse.json({ decisions, meetings, canManage: can.manageCommittee(user) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageCommittee(user)) return jsonError("غير مصرح", 403);
    const body = createSchema.parse(await req.json());
    const decision = await db.committeeDecision.create({
      data: {
        meetingId: body.meetingId ?? null,
        title: body.title,
        recommendation: body.recommendation ?? null,
        ownerName: body.ownerName ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: body.status ?? "OPEN",
        createdById: parseInt(user.id, 10),
      },
    });
    await audit(parseInt(user.id, 10), "CREATE_COMMITTEE_DECISION", "CommitteeDecision", decision.id);
    return NextResponse.json({ decision }, { status: 201 });
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
    const existing = await db.committeeDecision.findUnique({ where: { id: body.id } });
    if (!existing) return jsonError("القرار غير موجود", 404);
    const decision = await db.committeeDecision.update({
      where: { id: body.id },
      data: {
        ...(body.status != null ? { status: body.status } : {}),
        ...(body.ownerName !== undefined ? { ownerName: body.ownerName } : {}),
        ...(body.dueDate !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
      },
    });
    await audit(parseInt(user.id, 10), "UPDATE_COMMITTEE_DECISION", "CommitteeDecision", decision.id);
    return NextResponse.json({ decision });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
