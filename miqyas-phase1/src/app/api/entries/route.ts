import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Period } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { scopeFilter } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { getSetting } from "@/lib/settings";
import {
  achievementPct,
  deviationValue,
  deviationPct,
  kpiStatus,
  resolvePeriods,
} from "@/lib/kpi";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  period: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
});

const postSchema = z
  .object({
    kpiId: z.number().int().positive(),
    year: z.number().int().min(2000).max(2100),
    period: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
    actualValue: z.number(),
    whatHappened: z.string().max(5000).optional().nullable(),
    howHappened: z.string().max(5000).optional().nullable(),
  })
  .strict();

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
              select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
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

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = postSchema.parse(await req.json());
    const userId = parseInt(user.id, 10);

    const kpi = await db.kpi.findUnique({
      where: { id: body.kpiId },
      select: { id: true, ownerId: true, polarity: true, frequency: true, sectionId: true, name: true, code: true },
    });

    if (!kpi) return jsonError("المؤشر غير موجود", 404);
    if (kpi.ownerId !== userId) return jsonError("غير مصرح — هذا المؤشر ليس من مهامك", 403);

    const allowedPeriods = resolvePeriods(kpi.frequency);
    if (!allowedPeriods.includes(body.period as Period)) {
      return jsonError("الفترة لا تتوافق مع دورية المؤشر", 400);
    }

    const target = await db.kpiTarget.findUnique({
      where: {
        kpiId_year_period: { kpiId: body.kpiId, year: body.year, period: body.period },
      },
    });

    if (!target) return jsonError("لا يوجد مستهدف لهذه الفترة", 400);

    const pct = achievementPct(body.actualValue, target.targetValue, kpi.polarity);
    const devVal = deviationValue(body.actualValue, target.targetValue);
    const status = kpiStatus(pct);

    const entry = await db.kpiEntry.upsert({
      where: {
        kpiId_year_period: { kpiId: body.kpiId, year: body.year, period: body.period },
      },
      create: {
        kpiId: body.kpiId,
        year: body.year,
        period: body.period,
        actualValue: body.actualValue,
        whatHappened: body.whatHappened ?? null,
        howHappened: body.howHappened ?? null,
        achievementPct: pct,
        deviationValue: devVal,
        status,
        enteredById: userId,
        approvalStatus: "PENDING",
      },
      update: {
        actualValue: body.actualValue,
        whatHappened: body.whatHappened ?? null,
        howHappened: body.howHappened ?? null,
        achievementPct: pct,
        deviationValue: devVal,
        status,
        enteredById: userId,
        approvalStatus: "PENDING",
        approvedById: null,
        approvedAt: null,
        rejectReason: null,
      },
    });

    const delegationOn = (await getSetting("section_head_can_approve")) === "1";
    const approverIds: number[] = [];

    const admins = await db.user.findMany({
      where: { role: "SYSTEM_ADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    approverIds.push(...admins.map((a) => a.id));

    if (delegationOn && kpi.sectionId) {
      const heads = await db.user.findMany({
        where: { role: "SECTION_HEAD", sectionId: kpi.sectionId, status: "ACTIVE" },
        select: { id: true },
      });
      for (const h of heads) {
        if (!approverIds.includes(h.id)) approverIds.push(h.id);
      }
    }

    await notify({
      userIds: approverIds,
      type: "APPROVAL_REQUEST",
      title: "طلب اعتماد قياس جديد",
      body: `${user.name} أرسل قياسًا للمؤشر ${kpi.code} — ${kpi.name}`,
      link: "/approvals",
      email: true,
    });

    await audit(userId, "SUBMIT_ENTRY", "KpiEntry", entry.id, {
      kpiId: body.kpiId,
      year: body.year,
      period: body.period,
    });

    return NextResponse.json({
      entry: {
        ...entry,
        deviationPct: deviationPct(entry.achievementPct),
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
