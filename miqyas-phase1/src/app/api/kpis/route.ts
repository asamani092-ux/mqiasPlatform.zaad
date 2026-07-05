import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireManageKpis } from "@/lib/admin-auth";
import { kpiBodySchema } from "@/lib/kpi-schemas";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const listQuery = z.object({
  type: z.enum(["STRATEGIC", "OPERATIONAL"]).optional(),
  departmentId: z.coerce.number().int().optional(),
  frequency: z.enum(["QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]).optional(),
  search: z.string().optional(),
  active: z.enum(["true", "false", "all"]).optional().default("true"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    requireManageKpis(user);

    const q = listQuery.parse(Object.fromEntries(req.nextUrl.searchParams));
    const where: Record<string, unknown> = {};

    if (q.active !== "all") where.active = q.active === "true";
    if (q.type) where.type = q.type;
    if (q.departmentId) where.departmentId = q.departmentId;
    if (q.frequency) where.frequency = q.frequency;
    if (q.search) {
      where.OR = [
        { code: { contains: q.search, mode: "insensitive" } },
        { name: { contains: q.search, mode: "insensitive" } },
      ];
    }

    const kpis = await db.kpi.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        section: { select: { id: true, name: true, code: true } },
        owner: { select: { id: true, name: true } },
        strategicGoal: { select: { id: true, code: true, title: true } },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ kpis });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    requireManageKpis(user);

    const body = kpiBodySchema.parse(await req.json());
    const kpi = await db.kpi.create({ data: body });

    await audit(parseInt(user.id, 10), "CREATE_KPI", "Kpi", kpi.id, { code: kpi.code });
    return NextResponse.json({ kpi }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
