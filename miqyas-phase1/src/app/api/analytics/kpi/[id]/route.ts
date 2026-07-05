import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scopedKpiWhere } from "@/lib/analytics";
import { resolvePeriods } from "@/lib/kpi";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    const kpiId = parseInt(params.id, 10);
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? "2026", 10);

    const kpi = await db.kpi.findFirst({
      where: { id: kpiId, ...scopedKpiWhere(user) },
      include: {
        department: true,
        section: true,
        owner: { select: { name: true } },
        strategicGoal: true,
        targets: { where: { year } },
        entries: {
          where: { year, approvalStatus: "APPROVED" },
          include: { evidences: { select: { id: true, fileName: true } } },
        },
        deviationCards: { where: { year } },
      },
    });

    if (!kpi) return jsonError("غير مصرح أو غير موجود", 403);

    const periods = resolvePeriods(kpi.frequency);
    const targets = periods.map((period) => {
      const target = kpi.targets.find((t) => t.period === period);
      const entry = kpi.entries.find((e) => e.period === period);
      return {
        period,
        targetValue: target?.targetValue ?? null,
        entry: entry
          ? {
              actualValue: entry.actualValue,
              achievementPct: entry.achievementPct,
              whatHappened: entry.whatHappened,
              howHappened: entry.howHappened,
              evidences: entry.evidences,
            }
          : null,
      };
    });

    const period = req.nextUrl.searchParams.get("period");
    const deviationCard =
      kpi.deviationCards.find((c) => c.period === period) ?? kpi.deviationCards[0] ?? null;

    return NextResponse.json({ kpi, targets, deviationCard });
  } catch (e) {
    return handleApiError(e);
  }
}
