import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const findingSchema = z.object({
  engagementId: z.number().int().positive(),
  title: z.string().trim().min(2).max(300),
  description: z.string().max(8000).optional().nullable(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
  departmentId: z.number().int().positive().optional().nullable(),
  riskNote: z.string().max(5000).optional().nullable(),
});

const updateFindingSchema = findingSchema.partial().extend({
  id: z.number().int().positive(),
  forceClose: z.boolean().optional(),
});

const actionSchema = z.object({
  findingId: z.number().int().positive(),
  description: z.string().trim().min(2).max(2000),
  responsibleId: z.number().int().positive().optional().nullable(),
  responsibleName: z.string().max(200).optional().nullable(),
  dueDate: z.string().min(1),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "LATE"]).optional(),
});

const updateActionSchema = z.object({
  actionId: z.number().int().positive(),
  description: z.string().trim().min(2).max(2000).optional(),
  responsibleId: z.number().int().positive().optional().nullable(),
  responsibleName: z.string().max(200).optional().nullable(),
  dueDate: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "LATE"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.viewAuditOffice(user)) return jsonError("غير مصرح", 403);

    const engagementIdRaw = req.nextUrl.searchParams.get("engagementId");
    const engagementId = engagementIdRaw ? parseInt(engagementIdRaw, 10) : null;
    const where =
      engagementId != null && !Number.isNaN(engagementId) ? { engagementId } : {};

    const findings = await db.auditFinding.findMany({
      where,
      orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
      take: 500,
      include: {
        engagement: { select: { id: true, title: true, planId: true } },
        department: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        actions: {
          orderBy: { dueDate: "asc" },
          include: { responsible: { select: { id: true, name: true } } },
        },
      },
    });

    const engagements = await db.auditEngagement.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, planId: true, status: true },
      take: 200,
    });

    const departments = await db.department.findMany({
      orderBy: { deptNo: "asc" },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      findings,
      engagements,
      departments,
      canManage: can.manageAuditFindings(user),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageAuditFindings(user)) return jsonError("غير مصرح", 403);

    const raw = await req.json();
    if (raw?.kind === "action") {
      const body = actionSchema.parse(raw);
      const finding = await db.auditFinding.findUnique({ where: { id: body.findingId } });
      if (!finding) return jsonError("الملاحظة غير موجودة", 404);
      if (finding.status === "CLOSED") return jsonError("لا يمكن إضافة إجراء لملاحظة مغلقة", 400);

      const action = await db.auditCorrectiveAction.create({
        data: {
          findingId: body.findingId,
          description: body.description,
          responsibleId: body.responsibleId ?? null,
          responsibleName: body.responsibleName ?? null,
          dueDate: new Date(body.dueDate),
          status: body.status ?? "PENDING",
        },
      });

      if (finding.status === "OPEN") {
        await db.auditFinding.update({
          where: { id: finding.id },
          data: { status: "IN_PROGRESS" },
        });
      }

      await audit(parseInt(user.id, 10), "CREATE_AUDIT_ACTION", "AuditCorrectiveAction", action.id, {
        findingId: body.findingId,
      });

      return NextResponse.json({ action }, { status: 201 });
    }

    const body = findingSchema.parse(raw);
    const engagement = await db.auditEngagement.findUnique({ where: { id: body.engagementId } });
    if (!engagement) return jsonError("المهمة غير موجودة", 404);

    const finding = await db.auditFinding.create({
      data: {
        engagementId: body.engagementId,
        title: body.title,
        description: body.description ?? null,
        severity: body.severity ?? "MEDIUM",
        status: body.status ?? "OPEN",
        departmentId: body.departmentId ?? null,
        riskNote: body.riskNote ?? null,
        createdById: parseInt(user.id, 10),
      },
    });

    await audit(parseInt(user.id, 10), "CREATE_AUDIT_FINDING", "AuditFinding", finding.id, {
      title: finding.title,
    });

    return NextResponse.json({ finding }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageAuditFindings(user)) return jsonError("غير مصرح", 403);

    const raw = await req.json();
    if (raw?.kind === "action") {
      const body = updateActionSchema.parse(raw);
      const existing = await db.auditCorrectiveAction.findUnique({ where: { id: body.actionId } });
      if (!existing) return jsonError("الإجراء غير موجود", 404);

      const action = await db.auditCorrectiveAction.update({
        where: { id: body.actionId },
        data: {
          ...(body.description != null ? { description: body.description } : {}),
          ...(body.responsibleId !== undefined ? { responsibleId: body.responsibleId } : {}),
          ...(body.responsibleName !== undefined ? { responsibleName: body.responsibleName } : {}),
          ...(body.dueDate != null ? { dueDate: new Date(body.dueDate) } : {}),
          ...(body.status != null
            ? {
                status: body.status,
                completedAt: body.status === "DONE" ? new Date() : null,
              }
            : {}),
        },
      });

      await audit(parseInt(user.id, 10), "UPDATE_AUDIT_ACTION", "AuditCorrectiveAction", action.id, body);
      return NextResponse.json({ action });
    }

    const body = updateFindingSchema.parse(raw);
    const existing = await db.auditFinding.findUnique({
      where: { id: body.id },
      include: { actions: { select: { status: true } } },
    });
    if (!existing) return jsonError("الملاحظة غير موجودة", 404);

    if (body.status === "CLOSED") {
      const openActions = existing.actions.filter((a) => a.status !== "DONE");
      if (openActions.length > 0 && !body.forceClose) {
        return jsonError("لا يمكن إغلاق الملاحظة قبل إنجاز كل الإجراءات (أو استخدم الإغلاق القسري)", 400);
      }
    }

    const finding = await db.auditFinding.update({
      where: { id: body.id },
      data: {
        ...(body.engagementId != null ? { engagementId: body.engagementId } : {}),
        ...(body.title != null ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.severity != null ? { severity: body.severity } : {}),
        ...(body.departmentId !== undefined ? { departmentId: body.departmentId } : {}),
        ...(body.riskNote !== undefined ? { riskNote: body.riskNote } : {}),
        ...(body.status != null
          ? {
              status: body.status,
              closedAt: body.status === "CLOSED" ? new Date() : null,
            }
          : {}),
      },
    });

    await audit(parseInt(user.id, 10), "UPDATE_AUDIT_FINDING", "AuditFinding", finding.id, body);
    return NextResponse.json({ finding });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
