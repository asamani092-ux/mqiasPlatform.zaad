import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scopedKpiWhere } from "@/lib/analytics";
import { deviationPct } from "@/lib/kpi";
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
    const entries = await db.kpiEntry.findMany({
      where: {
        year: body.year,
        period: body.period,
        approvalStatus: "APPROVED",
        status: { in: ["CRITICAL", "AT_RISK"] },
        kpi: scopedKpiWhere(user),
      },
      include: { kpi: true },
    });

    let created = 0;
    for (const entry of entries) {
      const exists = await db.deviationCard.findUnique({
        where: { kpiId_year_period: { kpiId: entry.kpiId, year: body.year, period: body.period } },
      });
      if (exists) continue;

      const target = await db.kpiTarget.findUnique({
        where: { kpiId_year_period: { kpiId: entry.kpiId, year: body.year, period: body.period } },
      });

      await db.deviationCard.create({
        data: {
          kpiId: entry.kpiId,
          year: body.year,
          period: body.period,
          targetValue: target?.targetValue ?? entry.actualValue,
          actualValue: entry.actualValue,
          deviationPct: deviationPct(entry.achievementPct) ?? 0,
          reasons: "توليد آلي — أداء حرج أو معرّض للخطر",
          createdById: parseInt(user.id, 10),
        },
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
