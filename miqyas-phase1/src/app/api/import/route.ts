import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireManageKpis } from "@/lib/admin-auth";
import { dryRunImport, type ParsedImportRow } from "@/lib/import-excel";
import { achievementPct, deviationValue, kpiStatus } from "@/lib/kpi";
import { getSetting } from "@/lib/settings";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const previewCache = new Map<string, ParsedImportRow[]>();

const confirmSchema = z.object({ confirm: z.literal(true), year: z.number().int().optional() });

async function commitImport(
  rows: ParsedImportRow[],
  adminUserId: number,
  year: number,
) {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const kpiByCode = new Map<string, { id: number }>();

  for (const row of rows) {
    if (row.status === "ERROR") {
      errors++;
      continue;
    }

    try {
      let strategicGoalId: number | undefined;
      if (row.goalCode) {
        const prefix = row.goalCode.split("-")[0];
        const goal = await db.strategicGoal.findUnique({ where: { code: prefix } });
        if (goal) strategicGoalId = goal.id;
      }

      const kpi = await db.kpi.upsert({
        where: { code: row.code },
        create: {
          code: row.code,
          name: row.name,
          type: row.type,
          unit: row.unit,
          polarity: row.polarity,
          frequency: row.frequency,
          requiredData: row.requiredData || null,
          departmentId: row.departmentId,
          ownerLabel: row.ownerLabel,
          baseline: row.baseline,
          annualTarget: row.annualTarget,
          recommendation: row.recommendation,
          strategicGoalId,
          active: true,
        },
        update: {
          name: row.name,
          type: row.type,
          unit: row.unit,
          polarity: row.polarity,
          frequency: row.frequency,
          requiredData: row.requiredData || null,
          departmentId: row.departmentId,
          ownerLabel: row.ownerLabel,
          baseline: row.baseline,
          annualTarget: row.annualTarget,
          recommendation: row.recommendation ?? undefined,
          strategicGoalId,
          active: true,
        },
      });

      kpiByCode.set(row.code, { id: kpi.id });
      if (row.status === "NEW") created++;
      else updated++;

      if (row.periodTarget != null) {
        await db.kpiTarget.upsert({
          where: { kpiId_year_period: { kpiId: kpi.id, year, period: row.period } },
          create: { kpiId: kpi.id, year, period: row.period, targetValue: row.periodTarget },
          update: { targetValue: row.periodTarget },
        });
      }

      if (row.actualValue != null) {
        const target = row.periodTarget ?? (await db.kpiTarget.findUnique({
          where: { kpiId_year_period: { kpiId: kpi.id, year, period: row.period } },
        }))?.targetValue;

        const pct = target != null ? achievementPct(row.actualValue, target, row.polarity) : null;
        const devVal = target != null ? deviationValue(row.actualValue, target) : null;
        const status = kpiStatus(pct);
        const ownerId = kpi.ownerId ?? adminUserId;

        await db.kpiEntry.upsert({
          where: { kpiId_year_period: { kpiId: kpi.id, year, period: row.period } },
          create: {
            kpiId: kpi.id,
            year,
            period: row.period,
            actualValue: row.actualValue,
            whatHappened: row.whatHappened,
            howHappened: row.howHappened,
            recommendation: row.recommendation,
            achievementPct: pct,
            deviationValue: devVal,
            status,
            enteredById: ownerId,
            approvalStatus: row.approvalStatus,
            approvedAt: row.approvalStatus === "APPROVED" ? new Date() : null,
          },
          update: {
            actualValue: row.actualValue,
            whatHappened: row.whatHappened,
            howHappened: row.howHappened,
            recommendation: row.recommendation ?? undefined,
            achievementPct: pct,
            deviationValue: devVal,
            status,
            approvalStatus: row.approvalStatus,
            approvedAt: row.approvalStatus === "APPROVED" ? new Date() : null,
          },
        });
      }
    } catch {
      errors++;
    }
  }

  return { created, updated, skipped, errors, kpiCount: kpiByCode.size };
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    requireManageKpis(user);

    const contentType = req.headers.get("content-type") ?? "";
    const year = parseInt((await getSetting("current_year")) || "2026", 10);

    if (contentType.includes("application/json")) {
      const body = confirmSchema.parse(await req.json());
      const pending = previewCache.get(user.id);
      if (!pending?.length) return jsonError("لا توجد معاينة — ارفع الملف أولاً", 400);

      const result = await commitImport(pending, parseInt(user.id, 10), body.year ?? year);
      await audit(parseInt(user.id, 10), "IMPORT_EXCEL", "Kpi", undefined, result);
      previewCache.delete(user.id);

      return NextResponse.json({ ok: true, ...result });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) return jsonError("لم يُرفَع ملف", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const departments = await db.department.findMany({ select: { id: true, name: true } });
    const existing = await db.kpi.findMany({ select: { id: true, code: true } });
    const existingCodes = new Map(existing.map((k) => [k.code, k.id]));

    const preview = await dryRunImport(buffer, departments, existingCodes, year);

    previewCache.set(user.id, preview.rows);

    return NextResponse.json(preview);
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
