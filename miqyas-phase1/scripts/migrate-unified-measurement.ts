/**
 * ترحيل تراكمي: إنشاء MeasurementRequirement من كل Kpi،
 * MeasurementPeriod من KpiEntry، ونقل Evidence إلى الفترة الموحّدة.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  const kpis = await db.kpi.findMany({ orderBy: { id: "asc" } });
  let reqCreated = 0;
  let linked = 0;

  for (const kpi of kpis) {
    let req = await db.measurementRequirement.findUnique({ where: { code: kpi.code } });
    if (!req) {
      req = await db.measurementRequirement.create({
        data: {
          code: kpi.code,
          name: kpi.name,
          unit: kpi.unit,
          polarity: kpi.polarity,
          frequency: kpi.frequency,
          requiredData: kpi.requiredData,
          departmentId: kpi.departmentId,
          sectionId: kpi.sectionId,
          ownerId: kpi.ownerId,
          active: kpi.active,
        },
      });
      reqCreated++;
    } else {
      await db.measurementRequirement.update({
        where: { id: req.id },
        data: {
          name: kpi.name,
          unit: kpi.unit,
          polarity: kpi.polarity,
          frequency: kpi.frequency,
          requiredData: kpi.requiredData,
          departmentId: kpi.departmentId ?? req.departmentId,
          sectionId: kpi.sectionId ?? req.sectionId,
          ownerId: kpi.ownerId ?? req.ownerId,
          active: kpi.active,
        },
      });
    }

    if (kpi.requirementId !== req.id) {
      await db.kpi.update({ where: { id: kpi.id }, data: { requirementId: req.id } });
      linked++;
    }
  }

  const entries = await db.kpiEntry.findMany({
    include: { kpi: { select: { requirementId: true } }, evidences: true },
    orderBy: { id: "asc" },
  });

  let periods = 0;
  let evidencesMoved = 0;

  for (const entry of entries) {
    const requirementId = entry.kpi.requirementId;
    if (!requirementId) continue;

    const mp = await db.measurementPeriod.upsert({
      where: {
        requirementId_year_period: {
          requirementId,
          year: entry.year,
          period: entry.period,
        },
      },
      create: {
        requirementId,
        year: entry.year,
        period: entry.period,
        actualValue: entry.actualValue,
        whatHappened: entry.whatHappened,
        howHappened: entry.howHappened,
        note: entry.note,
        enteredById: entry.enteredById,
        approvalStatus: entry.approvalStatus,
        approvedById: entry.approvedById,
        approvedAt: entry.approvedAt,
        rejectReason: entry.rejectReason,
      },
      update: {
        actualValue: entry.actualValue,
        whatHappened: entry.whatHappened,
        howHappened: entry.howHappened,
        note: entry.note,
        approvalStatus: entry.approvalStatus,
        approvedById: entry.approvedById,
        approvedAt: entry.approvedAt,
        rejectReason: entry.rejectReason,
      },
    });
    periods++;

    for (const ev of entry.evidences) {
      if (ev.measurementPeriodId === mp.id) continue;
      await db.evidence.update({
        where: { id: ev.id },
        data: { measurementPeriodId: mp.id },
      });
      evidencesMoved++;
    }
  }

  console.log(
    JSON.stringify(
      { reqCreated, linked, periodsUpserted: periods, evidencesMoved, kpis: kpis.length },
      null,
      2
    )
  );

  await db.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
