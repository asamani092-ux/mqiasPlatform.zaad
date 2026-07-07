import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { CardStatus, Period } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { scopedKpiWhere } from "@/lib/analytics";
import { audit } from "@/lib/audit";
import { deviationPct } from "@/lib/kpi";
import { summarizeDeviationCards } from "@/lib/deviation-stats";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

async function countLateActions(year: number, period: Period, scope: Record<string, unknown>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return db.correctiveAction.count({
    where: {
      OR: [
        { status: "LATE" },
        { status: { in: ["PENDING", "IN_PROGRESS"] }, dueDate: { lt: today } },
      ],
      card: { year, period, kpi: scope },
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const status = req.nextUrl.searchParams.get("status") as CardStatus | null;
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? "2026", 10);
    const period = (req.nextUrl.searchParams.get("period") ?? "Q1") as Period;
    const scope = scopedKpiWhere(user);

    const [allCards, filteredCards, lateActions] = await Promise.all([
      db.deviationCard.findMany({
        where: { year, period, kpi: scope },
        select: { id: true, status: true, actions: { select: { status: true } } },
      }),
      db.deviationCard.findMany({
        where: {
          year,
          period,
          ...(status ? { status } : {}),
          kpi: scope,
        },
        include: {
          kpi: { select: { code: true, name: true, unit: true } },
          createdBy: { select: { name: true } },
          actions: { include: { responsible: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      countLateActions(year, period, scope),
    ]);

    const summary = summarizeDeviationCards(allCards, lateActions);

    return NextResponse.json({ cards: filteredCards, summary });
  } catch (e) {
    return handleApiError(e);
  }
}

const createSchema = z.object({
  kpiId: z.number().int().positive(),
  year: z.number().int(),
  period: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
  reasons: z.string().min(3).max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageDeviation(user)) return jsonError("غير مصرح", 403);

    const body = createSchema.parse(await req.json());
    const kpi = await db.kpi.findFirst({
      where: { id: body.kpiId, ...scopedKpiWhere(user) },
    });
    if (!kpi) return jsonError("المؤشر غير موجود أو غير مصرح", 403);

    const entry = await db.kpiEntry.findFirst({
      where: {
        kpiId: body.kpiId,
        year: body.year,
        period: body.period,
        approvalStatus: "APPROVED",
      },
    });
    if (!entry) return jsonError("لا يوجد قياس معتمد لهذه الفترة", 400);

    const target = await db.kpiTarget.findUnique({
      where: { kpiId_year_period: { kpiId: body.kpiId, year: body.year, period: body.period } },
    });

    const card = await db.deviationCard.upsert({
      where: { kpiId_year_period: { kpiId: body.kpiId, year: body.year, period: body.period } },
      create: {
        kpiId: body.kpiId,
        year: body.year,
        period: body.period,
        targetValue: target?.targetValue ?? entry.actualValue,
        actualValue: entry.actualValue,
        deviationPct: deviationPct(entry.achievementPct) ?? 0,
        reasons: body.reasons,
        createdById: parseInt(user.id, 10),
      },
      update: { reasons: body.reasons, status: "IN_PROGRESS" },
    });

    await audit(parseInt(user.id, 10), "CREATE_DEVIATION_CARD", "DeviationCard", card.id);
    return NextResponse.json({ card });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
