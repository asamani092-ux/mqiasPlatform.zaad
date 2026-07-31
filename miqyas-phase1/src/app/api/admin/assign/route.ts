import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  departmentId: z.coerce.number().int().positive().optional(),
  sectionId: z.coerce.number().int().positive().optional(),
  fillerRole: z.enum(["EMPLOYEE", "SECTION_HEAD", "DEPT_MANAGER"]).optional(),
  q: z.string().max(100).optional(),
  unassigned: z
    .enum(["0", "1"])
    .optional()
    .transform((v) => v === "1"),
});

const postSchema = z
  .object({
    requirementIds: z.array(z.number().int().positive()).min(1).max(500),
    ownerId: z.number().int().positive().nullable(),
    fillerRole: z.enum(["EMPLOYEE", "SECTION_HEAD", "DEPT_MANAGER"]).optional(),
    action: z.enum(["assign", "unassign"]).default("assign"),
  })
  .strict();

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.assignRequirements(user)) return jsonError("غير مصرح", 403);

    const q = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const where: Record<string, unknown> = { active: true };
    if (q.departmentId) where.departmentId = q.departmentId;
    if (q.sectionId) where.sectionId = q.sectionId;
    if (q.fillerRole) where.fillerRole = q.fillerRole;
    if (q.unassigned) where.ownerId = null;
    if (q.q?.trim()) {
      where.OR = [
        { code: { contains: q.q.trim(), mode: "insensitive" } },
        { name: { contains: q.q.trim(), mode: "insensitive" } },
      ];
    }

    const [requirements, users, departments, sections] = await Promise.all([
      db.measurementRequirement.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          fillerRole: true,
          ownerId: true,
          departmentId: true,
      sectionId: true,
      owner: {
        select: {
          id: true,
          name: true,
          role: true,
          departmentId: true,
          department: { select: { name: true } },
        },
      },
      department: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
        },
        orderBy: { code: "asc" },
        take: 500,
      }),
      db.user.findMany({
        where: {
          status: "ACTIVE",
          role: { in: ["EMPLOYEE", "SECTION_HEAD", "DEPT_MANAGER"] },
        },
        select: {
          id: true,
          name: true,
          role: true,
          departmentId: true,
          sectionId: true,
          department: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
      db.department.findMany({
        select: { id: true, name: true },
        orderBy: { deptNo: "asc" },
      }),
      db.section.findMany({
        select: { id: true, name: true, departmentId: true },
        orderBy: { code: "asc" },
      }),
    ]);

    return NextResponse.json({ requirements, users, departments, sections });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.assignRequirements(user)) return jsonError("غير مصرح", 403);
    const actorId = parseInt(user.id, 10);

    const body = postSchema.parse(await req.json());
    const reqs = await db.measurementRequirement.findMany({
      where: { id: { in: body.requirementIds }, active: true },
      select: { id: true, code: true, name: true, departmentId: true, sectionId: true },
    });
    if (reqs.length === 0) return jsonError("لا متطلبات محددة", 404);

    if (body.action === "unassign") {
      const result = await db.measurementRequirement.updateMany({
        where: { id: { in: reqs.map((r) => r.id) } },
        data: { ownerId: null },
      });
      await db.kpi.updateMany({
        where: { requirementId: { in: reqs.map((r) => r.id) } },
        data: { ownerId: null },
      });
      await audit(actorId, "BULK_UNASSIGN_REQUIREMENTS", "MeasurementRequirement", 0, {
        count: result.count,
        requirementIds: body.requirementIds,
      });
      return NextResponse.json({ updated: result.count });
    }

    if (body.ownerId == null || !body.fillerRole) {
      return jsonError("المسؤول ودور التعبئة مطلوبان", 400);
    }

    const owner = await db.user.findUnique({
      where: { id: body.ownerId },
      select: { id: true, role: true, status: true, departmentId: true, sectionId: true, name: true },
    });
    if (!owner || owner.status !== "ACTIVE") return jsonError("المستخدم غير موجود", 404);
    if (owner.role !== body.fillerRole) {
      return jsonError("دور التعبئة لا يطابق دور المستخدم المحدد", 400);
    }

    // تقييد النطاق: المسؤول يجب أن يشارك إدارة/قسم المتطلب عند توفرهما
    for (const r of reqs) {
      if (body.fillerRole === "SECTION_HEAD" && r.sectionId != null && owner.sectionId !== r.sectionId) {
        return jsonError(`رئيس القسم خارج نطاق المتطلب ${r.code}`, 400);
      }
      if (
        (body.fillerRole === "DEPT_MANAGER" || body.fillerRole === "EMPLOYEE") &&
        r.departmentId != null &&
        owner.departmentId !== r.departmentId
      ) {
        return jsonError(`المسؤول خارج إدارة المتطلب ${r.code}`, 400);
      }
    }

    const result = await db.measurementRequirement.updateMany({
      where: { id: { in: reqs.map((r) => r.id) } },
      data: { ownerId: body.ownerId, fillerRole: body.fillerRole },
    });

    await db.kpi.updateMany({
      where: { requirementId: { in: reqs.map((r) => r.id) } },
      data: { ownerId: body.ownerId },
    });

    await notify({
      userIds: [body.ownerId],
      type: "SYSTEM",
      title: "أُسندت إليك متطلبات قياس",
      body: `عدد المتطلبات: ${result.count}`,
      link: "/my",
      email: true,
    });

    await audit(actorId, "BULK_ASSIGN_REQUIREMENTS", "MeasurementRequirement", 0, {
      count: result.count,
      ownerId: body.ownerId,
      fillerRole: body.fillerRole,
      requirementIds: body.requirementIds,
    });

    return NextResponse.json({ updated: result.count });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
