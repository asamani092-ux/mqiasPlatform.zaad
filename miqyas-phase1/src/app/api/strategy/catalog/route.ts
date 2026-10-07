import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { catalogDeptScope } from "@/lib/strategy-office";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const listQuery = z.object({
  domain: z.enum(["STRATEGIC", "OPERATIONAL", "GOVERNANCE"]).optional(),
  feedsStrategic: z.enum(["true", "false"]).optional(),
  isGovernanceRequirement: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
  active: z.enum(["true", "false", "all"]).optional().default("true"),
});

/** قراءة الكتالوج — الكتابة موحّدة في /api/kpis */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.viewStrategyOffice(user)) return jsonError("غير مصرح", 403);

    const q = listQuery.parse(Object.fromEntries(req.nextUrl.searchParams));
    const where: Record<string, unknown> = {
      OR: [{ feedsStrategic: true }, { isGovernanceRequirement: true }],
    };
    if (q.active !== "all") where.active = q.active === "true";
    if (q.feedsStrategic) where.feedsStrategic = q.feedsStrategic === "true";
    if (q.isGovernanceRequirement) {
      where.isGovernanceRequirement = q.isGovernanceRequirement === "true";
      delete (where as { OR?: unknown }).OR;
    }
    if (q.feedsStrategic === "true") {
      delete (where as { OR?: unknown }).OR;
    }
    if (q.domain === "GOVERNANCE") {
      where.isGovernanceRequirement = true;
      delete (where as { OR?: unknown }).OR;
    } else if (q.domain === "STRATEGIC") {
      where.feedsStrategic = true;
      delete (where as { OR?: unknown }).OR;
    } else if (q.domain === "OPERATIONAL") {
      where.domain = "OPERATIONAL";
      delete (where as { OR?: unknown }).OR;
    }

    const deptScope = catalogDeptScope(user);
    if (deptScope && !can.manageKpis(user) && user.role === "DEPT_MANAGER") {
      where.departmentId = deptScope.departmentId;
    }

    if (q.search?.trim()) {
      where.AND = [
        {
          OR: [
            { code: { contains: q.search.trim(), mode: "insensitive" } },
            { name: { contains: q.search.trim(), mode: "insensitive" } },
          ],
        },
      ];
    }

    const kpis = await db.kpi.findMany({
      where,
      take: 1000,
      include: {
        department: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        requirement: { select: { id: true, code: true, domain: true, ownerId: true } },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({
      kpis,
      canManage: can.writeKpis(user),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function POST() {
  return jsonError("الكتابة موحّدة في إدارة المؤشرات — استخدم /admin/kpis", 410);
}

export async function PUT() {
  return jsonError("الكتابة موحّدة في إدارة المؤشرات — استخدم /admin/kpis", 410);
}
