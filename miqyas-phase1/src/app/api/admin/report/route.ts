import { NextRequest, NextResponse } from "next/server";
import type { Period } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { FINAL_APPROVED_STATUSES } from "@/lib/approval-status";
import { achievementPct, kpiStatus } from "@/lib/kpi";
import { PERIOD_LABEL, type Period as UiPeriod } from "@/lib/types";

export const dynamic = "force-dynamic";

const PERIODS = new Set<string>(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]);

/** بيانات تقرير العرض — FINAL_APPROVED · اختيار سنة/فترة عبر الاستعلام · O(n) */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageKpis(user)) return jsonError("غير مصرح", 403);

    const sp = req.nextUrl.searchParams;
    const yearParam = sp.get("year");
    const periodParam = sp.get("period");

    const year =
      yearParam && /^\d{4}$/.test(yearParam)
        ? parseInt(yearParam, 10)
        : parseInt(await getSetting("measurement_round_year"), 10) || new Date().getFullYear();

    const period = (
      periodParam && PERIODS.has(periodParam)
        ? periodParam
        : (await getSetting("measurement_round_period")) || "Q1"
    ) as Period;

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

    const byStatus = {
      ACHIEVED: kpis.filter((k) => k.status === "ACHIEVED").length,
      ON_TRACK: kpis.filter((k) => k.status === "ON_TRACK").length,
      AT_RISK: kpis.filter((k) => k.status === "AT_RISK").length,
      CRITICAL: kpis.filter((k) => k.status === "CRITICAL").length,
      NO_DATA: kpis.filter((k) => k.status === "NO_DATA").length,
    };

    const byDepartment = Object.entries(
      kpis.reduce<Record<string, { count: number; sumAch: number; withAch: number }>>((acc, k) => {
        const key = k.departmentName || "بدون إدارة";
        if (!acc[key]) acc[key] = { count: 0, sumAch: 0, withAch: 0 };
        acc[key].count += 1;
        if (k.achievementPct != null) {
          acc[key].sumAch += k.achievementPct;
          acc[key].withAch += 1;
        }
        return acc;
      }, {})
    )
      .map(([name, v]) => ({
        name,
        count: v.count,
        avgAchievement: v.withAch > 0 ? Math.round((v.sumAch / v.withAch) * 10) / 10 : null,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    return NextResponse.json({
      year,
      period,
      periodLabel: PERIOD_LABEL[period as UiPeriod] || period,
      summary: {
        measured: kpis.length,
        avgAchievement,
        atRisk: byStatus.AT_RISK + byStatus.CRITICAL,
        achieved: byStatus.ACHIEVED,
        onTrack: byStatus.ON_TRACK,
        critical: byStatus.CRITICAL,
      },
      byStatus,
      byDepartment,
      kpis,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
