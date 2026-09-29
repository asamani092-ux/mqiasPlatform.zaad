import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { MeasurementDomain } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { requireManageStrategyCatalog } from "@/lib/admin-auth";
import { kpiBodySchema } from "@/lib/kpi-schemas";
import { ensureRequirementFromKpi } from "@/lib/kpi-owner-sync";
import { catalogDeptScope, domainFromKpiType } from "@/lib/strategy-office";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const listQuery = z.object({
  domain: z.enum(["STRATEGIC", "OPERATIONAL", "GOVERNANCE"]).optional(),
  search: z.string().optional(),
  active: z.enum(["true", "false", "all"]).optional().default("true"),
});

function resolveDomain(
  type: "STRATEGIC" | "OPERATIONAL",
  domain?: MeasurementDomain,
): MeasurementDomain {
  if (domain) return domain;
  return domainFromKpiType(type);
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.viewStrategyOffice(user)) return jsonError("غير مصرح", 403);

    const q = listQuery.parse(Object.fromEntries(req.nextUrl.searchParams));
    const where: Record<string, unknown> = {
      domain: q.domain ? q.domain : { in: ["STRATEGIC", "GOVERNANCE"] },
    };
    if (q.active !== "all") where.active = q.active === "true";

    const deptScope = catalogDeptScope(user);
    if (deptScope && !can.manageKpis(user) && user.role === "DEPT_MANAGER") {
      // مدير إدارة يرى نطاق إدارته في الكتالوج
      where.departmentId = deptScope.departmentId;
    }

    if (q.search?.trim()) {
      where.OR = [
        { code: { contains: q.search.trim(), mode: "insensitive" } },
        { name: { contains: q.search.trim(), mode: "insensitive" } },
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
      canManage: can.manageStrategyCatalog(user),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    requireManageStrategyCatalog(user);

    const raw = kpiBodySchema.parse(await req.json());
    const domain = resolveDomain(raw.type, raw.domain as MeasurementDomain | undefined);

    // حوكمة تُخزَّن كمؤشر استراتيجي بالنوع مع domain=GOVERNANCE لدورة الشاهد الموحّدة
    const type = domain === "OPERATIONAL" ? "OPERATIONAL" : "STRATEGIC";

    let departmentId = raw.departmentId ?? null;
    if (user.role === "DEPT_MANAGER") {
      if (user.departmentId == null) return jsonError("لا إدارة مربوطة بحسابك", 400);
      departmentId = user.departmentId;
    }

    const kpi = await db.kpi.create({
      data: {
        code: raw.code,
        name: raw.name,
        type,
        domain,
        unit: raw.unit,
        polarity: raw.polarity,
        frequency: raw.frequency,
        requiredData: raw.requiredData ?? null,
        departmentId,
        sectionId: raw.sectionId ?? null,
        ownerLabel: raw.ownerLabel ?? null,
        ownerId: raw.ownerId ?? null,
        baseline: raw.baseline ?? null,
        annualTarget: raw.annualTarget ?? null,
        strategicGoalId: raw.strategicGoalId ?? null,
        operationalGoalId: raw.operationalGoalId ?? null,
        recommendation: raw.recommendation ?? null,
        measureFormula: raw.measureFormula ?? null,
        active: true,
      },
    });

    await ensureRequirementFromKpi(kpi);

    // ربط سجل حوكمة موجود بنفس الرمز إن وُجد (تراكمي)
    if (domain === "GOVERNANCE") {
      const req = await db.measurementRequirement.findUnique({
        where: { code: kpi.code },
        select: { id: true },
      });
      if (req) {
        await db.governanceRequirement.updateMany({
          where: { code: kpi.code, measurementRequirementId: null },
          data: { measurementRequirementId: req.id },
        });
      }
    }

    await audit(parseInt(user.id, 10), "CREATE_STRATEGY_KPI", "Kpi", kpi.id, {
      code: kpi.code,
      domain,
    });

    return NextResponse.json({ kpi }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    requireManageStrategyCatalog(user);

    const body = z
      .object({ id: z.number().int().positive() })
      .merge(kpiBodySchema.partial())
      .parse(await req.json());

    const existing = await db.kpi.findUnique({ where: { id: body.id } });
    if (!existing) return jsonError("المؤشر غير موجود", 404);

    if (user.role === "DEPT_MANAGER") {
      if (user.departmentId == null || existing.departmentId !== user.departmentId) {
        return jsonError("خارج نطاق إدارتك", 403);
      }
    }

    const { id, domain: domainIn, type: typeIn, ...rest } = body;
    const type = typeIn ?? existing.type;
    const domain = domainIn
      ? (domainIn as MeasurementDomain)
      : existing.domain === "GOVERNANCE"
        ? "GOVERNANCE"
        : domainFromKpiType(type);

    const kpi = await db.kpi.update({
      where: { id },
      data: {
        ...rest,
        type: domain === "OPERATIONAL" ? "OPERATIONAL" : type === "OPERATIONAL" ? "OPERATIONAL" : "STRATEGIC",
        domain,
        ...(user.role === "DEPT_MANAGER" ? { departmentId: user.departmentId } : {}),
      },
    });

    await ensureRequirementFromKpi(kpi);

    await audit(parseInt(user.id, 10), "UPDATE_STRATEGY_KPI", "Kpi", kpi.id, {
      code: kpi.code,
      domain: kpi.domain,
    });

    return NextResponse.json({ kpi });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
