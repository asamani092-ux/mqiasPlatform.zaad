import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});

const bodySchema = z.object({
  title: z.string().min(1).max(300),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1).optional().nullable(),
  eventType: z.enum(["GENERAL", "MEETING", "DEADLINE", "MILESTONE"]).default("GENERAL"),
  notes: z.string().max(5000).optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  sectionId: z.number().int().positive().optional().nullable(),
});

const updateSchema = bodySchema.partial().extend({
  id: z.number().int().positive(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.viewDeptCalendar(user)) return jsonError("غير مصرح", 403);

    const q = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const where: Record<string, unknown> = {};
    if (q.from || q.to) {
      where.startsAt = {
        ...(q.from ? { gte: new Date(q.from) } : {}),
        ...(q.to ? { lte: new Date(q.to) } : {}),
      };
    }
    if (user.role === "DEPT_MANAGER" && user.departmentId != null) {
      where.OR = [{ departmentId: user.departmentId }, { departmentId: null }];
    } else if (q.departmentId) {
      where.departmentId = q.departmentId;
    }

    const events = await db.calendarEvent.findMany({
      where,
      orderBy: { startsAt: "asc" },
      take: 500,
      include: {
        department: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      events,
      canManage: can.manageDeptCalendar(user),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageDeptCalendar(user)) return jsonError("غير مصرح", 403);

    const body = bodySchema.parse(await req.json());
    const event = await db.calendarEvent.create({
      data: {
        title: body.title,
        startsAt: new Date(body.startsAt),
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        eventType: body.eventType,
        notes: body.notes ?? null,
        departmentId: body.departmentId ?? user.departmentId,
        sectionId: body.sectionId ?? user.sectionId,
        createdById: parseInt(user.id, 10),
      },
    });

    await audit(parseInt(user.id, 10), "CREATE_CALENDAR_EVENT", "CalendarEvent", event.id, {
      title: event.title,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageDeptCalendar(user)) return jsonError("غير مصرح", 403);

    const body = updateSchema.parse(await req.json());
    const { id, ...rest } = body;
    const event = await db.calendarEvent.update({
      where: { id },
      data: {
        ...(rest.title != null ? { title: rest.title } : {}),
        ...(rest.startsAt != null ? { startsAt: new Date(rest.startsAt) } : {}),
        ...(rest.endsAt !== undefined
          ? { endsAt: rest.endsAt ? new Date(rest.endsAt) : null }
          : {}),
        ...(rest.eventType != null ? { eventType: rest.eventType } : {}),
        ...(rest.notes !== undefined ? { notes: rest.notes } : {}),
        ...(rest.departmentId !== undefined ? { departmentId: rest.departmentId } : {}),
        ...(rest.sectionId !== undefined ? { sectionId: rest.sectionId } : {}),
        updatedById: parseInt(user.id, 10),
      },
    });

    await audit(parseInt(user.id, 10), "UPDATE_CALENDAR_EVENT", "CalendarEvent", event.id, {
      title: event.title,
    });

    return NextResponse.json({ event });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageDeptCalendar(user)) return jsonError("غير مصرح", 403);

    const id = parseInt(req.nextUrl.searchParams.get("id") ?? "", 10);
    if (Number.isNaN(id)) return jsonError("معرّف غير صالح", 400);

    await db.calendarEvent.delete({ where: { id } });
    await audit(parseInt(user.id, 10), "DELETE_CALENDAR_EVENT", "CalendarEvent", id, {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
