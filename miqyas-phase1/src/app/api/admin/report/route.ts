import { NextResponse } from "next/server";
import type { Period } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { FINAL_APPROVED_STATUSES } from "@/lib/approval-status";
import { achievementPct, kpiStatus } from "@/lib/kpi";
import { PERIOD_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

/** بيانات تقرير العرض — FINAL_APPROVED لجولة القياس الحالية · O(n) */
export async function GET() {
  try {
    const user = await requireUser();
    if (!can.manageKpis(user)) return jsonError("غير مصرح", 403);

    const year = parseInt(await getSetting("measurement_round_year"), 10) || new Date().getFullYear();
    const period = ((await getSetting("measurement_round_period")) || "Q1") as Period;

    const entries = await db.kpiEntry.findMany({
      where: {
        year,
        period,
        approvalStatus: { in: [...FINAL_APPROVED_STATUSES] },
      },
      include: {
        kpi: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
            polarity: true,
            type: true,
            department: { select: { name: true } },
            targets: { where: { year, period }, take: 1, select: { targetValue: true } },
          },
        },
      },
      take: 500,
    });

    const kpis = entries
      .map((e) => {
      const target = e.kpi.targets[0]?.targetValue ?? null;
      const ach =
        target != null
          ? achievementPct(e.actualValue, target, e.kpi.polarity) ?? e.achievementPct
          : e.achievementPct;
      return {
        kpiId: e.kpi.id,
        code: e.kpi.code,
        name: e.kpi.name,
        type: e.kpi.type,
        unit: e.kpi.unit,
        departmentName: e.kpi.department?.name ?? null,
        target,
        actual: e.actualValue,
        achievementPct: ach,
        status: kpiStatus(ach),
      };
      })
      .sort((a, b) => a.code.localeCompare(b.code, "ar"));

    const withAch = kpis.filter((k) => k.achievementPct != null);
    const avgAchievement =
      withAch.length > 0
        ? Math.round(
            (withAch.reduce((s, k) => s + (k.achievementPct as number), 0) / withAch.length) * 10
          ) / 10
        : null;

    return NextResponse.json({
      year,
      period,
      periodLabel: PERIOD_LABEL[period] || period,
      summary: {
        measured: kpis.length,
        avgAchievement,
        atRisk: kpis.filter((k) => k.status === "AT_RISK" || k.status === "CRITICAL").length,
        achieved: kpis.filter((k) => k.status === "ACHIEVED").length,
      },
      kpis,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
