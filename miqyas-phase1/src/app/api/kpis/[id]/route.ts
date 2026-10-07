import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireWriteKpis } from "@/lib/admin-auth";
import { kpiUpdateSchema } from "@/lib/kpi-schemas";
import { resolveFeedFlags } from "@/lib/kpi-flags";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { ensureRequirementFromKpi } from "@/lib/kpi-owner-sync";

function assertDeptScope(
  user: { role: string; departmentId: number | null },
  departmentId: number | null,
): string | null {
  if (user.role === "DEPT_MANAGER") {
    if (user.departmentId == null) return "لا إدارة مربوطة بحسابك";
    if (departmentId != null && departmentId !== user.departmentId) {
      return "خارج نطاق إدارتك";
    }
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    requireWriteKpis(user);

    const id = parseInt(params.id, 10);
    const kpi = await db.kpi.findUnique({
      where: { id },
      include: {
        department: true,
        section: true,
        owner: { select: { id: true, name: true, email: true } },
        strategicGoal: true,
        operationalGoal: true,
        targets: { orderBy: [{ year: "desc" }, { period: "asc" }] },
      },
    });

    if (!kpi) return jsonError("المؤشر غير موجود", 404);
    const scopeErr = assertDeptScope(user, kpi.departmentId);
    if (scopeErr) return jsonError(scopeErr, 403);
    return NextResponse.json({ kpi });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    requireWriteKpis(user);

    const id = parseInt(params.id, 10);
    const existing = await db.kpi.findUnique({ where: { id } });
    if (!existing) return jsonError("المؤشر غير موجود", 404);
    const scopeErr = assertDeptScope(user, existing.departmentId);
    if (scopeErr) return jsonError(scopeErr, 403);

    const body = kpiUpdateSchema.parse(await req.json());
    const type = body.type ?? existing.type;
    const flags = resolveFeedFlags({
      type,
      feedsStrategic: body.feedsStrategic ?? existing.feedsStrategic,
      isGovernanceRequirement:
        body.isGovernanceRequirement ?? existing.isGovernanceRequirement,
      domain: body.domain ?? existing.domain,
    });

    let departmentId = body.departmentId !== undefined ? body.departmentId : existing.departmentId;
    if (user.role === "DEPT_MANAGER") {
      departmentId = user.departmentId;
    }

    const {
      domain: _d,
      feedsStrategic: _f,
      isGovernanceRequirement: _g,
      ...rest
    } = body;

    const kpi = await db.kpi.update({
      where: { id },
      data: {
        ...rest,
        ...(body.departmentId !== undefined || user.role === "DEPT_MANAGER"
          ? { departmentId }
          : {}),
        domain: flags.domain,
        feedsStrategic: flags.feedsStrategic,
        isGovernanceRequirement: flags.isGovernanceRequirement,
      },
    });
    await ensureRequirementFromKpi(kpi);
    await audit(parseInt(user.id, 10), "UPDATE_KPI", "Kpi", kpi.id, { code: kpi.code });

    return NextResponse.json({ kpi });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    requireWriteKpis(user);

    const id = parseInt(params.id, 10);
    const existing = await db.kpi.findUnique({ where: { id } });
    if (!existing) return jsonError("المؤشر غير موجود", 404);
    const scopeErr = assertDeptScope(user, existing.departmentId);
    if (scopeErr) return jsonError(scopeErr, 403);

    const kpi = await db.kpi.update({ where: { id }, data: { active: false } });
    await ensureRequirementFromKpi(kpi);
    await audit(parseInt(user.id, 10), "DELETE_KPI", "Kpi", kpi.id, { code: kpi.code, soft: true });

    return NextResponse.json({ kpi });
  } catch (e) {
    return handleApiError(e);
  }
}
