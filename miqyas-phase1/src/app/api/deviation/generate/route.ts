import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scopedKpiWhere } from "@/lib/analytics";
import { achievementPct, deviationPct } from "@/lib/kpi";
import { classifyStatus5 } from "@/lib/status5";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const genSchema = z.object({
  year: z.number().int(),
  period: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role !== "SYSTEM_ADMIN") return jsonError("مشرف النظام فقط", 403);

    const body = genSchema.parse(await req.json());
    const scope = scopedKpiWhere(user);

    const entries = await db.kpiEntry.findMany({
      where: {
        year: body.year,
        period: body.period,
        approvalStatus: "APPROVED",
        kpi: scope,
      },
      include: { kpi: { select: { polarity: true } } },
    });

    let created = 0;
    for (const entry of entries) {
      const target = await db.kpiTarget.findUnique({
        where: { kpiId_year_period: { kpiId: entry.kpiId, year: body.year, period: body.period } },
      });
      if (target == null) continue;

      const pct =
        achievementPct(entry.actualValue, target.targetValue, entry.kpi.polarity) ??
        entry.achievementPct;
      const status5 = classifyStatus5(entry.actualValue, pct);
      if (status5 !== "partial" && status5 !== "not_achieved") continue;

      const exists = await db.deviationCard.findUnique({
        where: { kpiId_year_period: { kpiId: entry.kpiId, year: body.year, period: body.period } },
      });
      if (exists) continue;

      const card = await db.deviationCard.create({
        data: {
          kpiId: entry.kpiId,
          year: body.year,
          period: body.period,
          targetValue: target.targetValue,
          actualValue: entry.actualValue,
          deviationPct: deviationPct(pct) ?? 0,
          reasons: "توليد آلي — أداء جزئي أو غير متحقق",
          createdById: parseInt(user.id, 10),
        },
      });
      await audit(parseInt(user.id, 10), "CREATE_DEVIATION_CARD", "DeviationCard", card.id, {
        generated: true,
      });
      created++;
    }

    await audit(parseInt(user.id, 10), "GENERATE_DEVIATION_CARDS", "DeviationCard", undefined, {
      year: body.year,
      period: body.period,
      created,
    });

    return NextResponse.json({ created });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
