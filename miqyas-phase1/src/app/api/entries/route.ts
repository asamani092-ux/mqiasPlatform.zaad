import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scopeFilter } from "@/lib/rbac";
import { deviationPct, resolvePeriods } from "@/lib/kpi";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  period: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const params = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const { year, period } = params;

    const kpis = await db.kpi.findMany({
      where: { active: true, ...scopeFilter(user) },
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        baseline: true,
        annualTarget: true,
        polarity: true,
        frequency: true,
        requiredData: true,
        ownerId: true,
        sectionId: true,
        targets: { where: { year, period }, take: 1 },
        entries: {
          where: { year, period },
          take: 1,
          include: {
            evidences: {
              where: { status: "ACTIVE" },
              select: {
                id: true,
                fileName: true,
                mimeType: true,
                sizeBytes: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { code: "asc" },
    });

    const items = kpis.map((kpi) => {
      const entry = kpi.entries[0] ?? null;
      const target = kpi.targets[0] ?? null;
      const pct = entry?.achievementPct ?? null;
      return {
        kpi: {
          id: kpi.id,
          code: kpi.code,
          name: kpi.name,
          unit: kpi.unit,
          baseline: kpi.baseline,
          annualTarget: kpi.annualTarget,
          polarity: kpi.polarity,
          frequency: kpi.frequency,
          requiredData: kpi.requiredData,
          ownerId: kpi.ownerId,
        },
        target: target ? { targetValue: target.targetValue } : null,
        entry: entry
          ? {
              id: entry.id,
              actualValue: entry.actualValue,
              achievementPct: entry.achievementPct,
              deviationValue: entry.deviationValue,
              deviationPct: deviationPct(entry.achievementPct),
              status: entry.status,
              whatHappened: entry.whatHappened,
              howHappened: entry.howHappened,
              recommendation: entry.recommendation,
              approvalStatus: entry.approvalStatus,
              rejectReason: entry.rejectReason,
              evidences: entry.evidences,
            }
          : null,
        periods: resolvePeriods(kpi.frequency),
      };
    });

    return NextResponse.json({ year, period, items });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("معاملات غير صالحة", 400);
    return handleApiError(e);
  }
}

/** STEP 8 — الكتابة عبر المسار التراثي معطّلة؛ استخدم /api/my/measurements */
export async function POST(_req: NextRequest) {
  return jsonError("استخدم مسار القياسات الموحّد (/my · /api/my/measurements)", 410);
}

export async function PUT(_req: NextRequest) {
  return jsonError("استخدم مسار القياسات الموحّد (/my · /api/my/measurements)", 410);
}

export async function DELETE(_req: NextRequest) {
  return jsonError("استخدم مسار القياسات الموحّد (/my · /api/my/measurements)", 410);
}
