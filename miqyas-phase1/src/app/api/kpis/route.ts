import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Period } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireWriteKpis } from "@/lib/admin-auth";
import { can } from "@/lib/rbac";
import { kpiBodySchema } from "@/lib/kpi-schemas";
import { resolveFeedFlags } from "@/lib/kpi-flags";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { getSetting } from "@/lib/settings";
import { frequenciesForPeriod } from "@/lib/kpi";
import { PERIOD_LABEL, type Period as UiPeriod } from "@/lib/types";
import { ensureRequirementFromKpi } from "@/lib/kpi-owner-sync";

const PERIOD_VALUES = ["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"] as const;

const listQuery = z.object({
  type: z.enum(["STRATEGIC", "OPERATIONAL"]).optional(),
  departmentId: z.coerce.number().int().optional(),
  frequency: z.enum(["QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]).optional(),
  search: z.string().optional(),
  active: z.enum(["true", "false", "all"]).optional().default("true"),
  showAll: z.enum(["true", "false"]).optional().default("false"),
  period: z.enum(PERIOD_VALUES).optional(),
  feedsStrategic: z.enum(["true", "false"]).optional(),
  isGovernanceRequirement: z.enum(["true", "false"]).optional(),
  id: z.coerce.number().int().positive().optional(),
});

function scopedDeptId(user: { role: string; departmentId: number | null }): number | null {
  if (user.role === "DEPT_MANAGER") return user.departmentId;
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    requireWriteKpis(user);

    const q = listQuery.parse(Object.fromEntries(req.nextUrl.searchParams));
    const where: Record<string, unknown> = {};
    const scoped = scopedDeptId(user);
    if (scoped != null) where.departmentId = scoped;

    if (q.id) where.id = q.id;
    if (q.active !== "all") where.active = q.active === "true";
    if (q.type) where.type = q.type;
    if (q.departmentId && scoped == null) where.departmentId = q.departmentId;
    if (q.feedsStrategic) where.feedsStrategic = q.feedsStrategic === "true";
    if (q.isGovernanceRequirement) {
      where.isGovernanceRequirement = q.isGovernanceRequirement === "true";
    }
    if (q.search) {
      where.OR = [
        { code: { contains: q.search, mode: "insensitive" } },
        { name: { contains: q.search, mode: "insensitive" } },
      ];
    }

    const roundYear =
      parseInt(await getSetting("measurement_round_year"), 10) || new Date().getFullYear();
    const roundPeriod = ((await getSetting("measurement_round_period")) || "Q1") as Period;
    const filterPeriod = (q.period || roundPeriod) as Period;

    if (q.frequency) {
      where.frequency = q.frequency;
    } else if (q.showAll !== "true") {
      where.frequency = { in: frequenciesForPeriod(filterPeriod) };
    }

    const kpis = await db.kpi.findMany({
      where,
      take: 1000,
      include: {
        department: { select: { id: true, name: true } },
        section: { select: { id: true, name: true, code: true } },
        owner: { select: { id: true, name: true } },
        strategicGoal: { select: { id: true, code: true, title: true } },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({
      kpis,
      round: {
        year: roundYear,
        period: roundPeriod,
        periodLabel: PERIOD_LABEL[roundPeriod as UiPeriod] || roundPeriod,
        filterPeriod,
        showAll: q.showAll === "true",
      },
      canImport: can.manageKpis(user),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    requireWriteKpis(user);

    const body = kpiBodySchema.parse(await req.json());
    const flags = resolveFeedFlags({
      type: body.type,
      feedsStrategic: body.feedsStrategic,
      isGovernanceRequirement: body.isGovernanceRequirement,
      domain: body.domain,
    });

    let departmentId = body.departmentId ?? null;
    const scoped = scopedDeptId(user);
    if (scoped != null) {
      if (user.departmentId == null) return jsonError("لا إدارة مربوطة بحسابك", 400);
      departmentId = user.departmentId;
    }

    const { domain: _d, feedsStrategic: _f, isGovernanceRequirement: _g, ...rest } = body;
    const kpi = await db.kpi.create({
      data: {
        ...rest,
        departmentId,
        domain: flags.domain,
        feedsStrategic: flags.feedsStrategic,
        isGovernanceRequirement: flags.isGovernanceRequirement,
      },
    });
    await ensureRequirementFromKpi(kpi);

    await audit(parseInt(user.id, 10), "CREATE_KPI", "Kpi", kpi.id, { code: kpi.code });
    return NextResponse.json({ kpi }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
