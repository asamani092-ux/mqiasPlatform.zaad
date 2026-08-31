import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireManageKpis } from "@/lib/admin-auth";
import { ensureRequirementFromKpi } from "@/lib/kpi-owner-sync";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

function authorizedViaCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** ترحيل تراكمي: ربط كل مؤشر نشط بمتطلب قياس · زمن O(n) · مكان O(1) */
export async function POST(req: NextRequest) {
  try {
    const viaCron = authorizedViaCron(req);
    let actorId = 0;

    if (!viaCron) {
      const user = await requireUser();
      requireManageKpis(user);
      actorId = parseInt(user.id, 10);
    }

    const kpis = await db.kpi.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        polarity: true,
        frequency: true,
        requiredData: true,
        departmentId: true,
        sectionId: true,
        ownerId: true,
        requirementId: true,
        active: true,
      },
    });

    let synced = 0;
    for (const kpi of kpis) {
      await ensureRequirementFromKpi(kpi);
      synced++;
    }

    if (actorId > 0) {
      await audit(actorId, "REPAIR_REQUIREMENTS", "MeasurementRequirement", 0, {
        synced,
        total: kpis.length,
      });
    }

    return NextResponse.json({ ok: true, synced, total: kpis.length });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function GET(req: NextRequest) {
  if (!authorizedViaCron(req)) return jsonError("غير مصرح", 401);
  return POST(req);
}
