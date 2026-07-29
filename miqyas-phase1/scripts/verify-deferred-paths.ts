import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import type { Period } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { runEarlyWarning } from "../src/lib/cron-jobs";
import { achievementPct, deviationPct } from "../src/lib/kpi";
import { classifyStatus5 } from "../src/lib/status5";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });
  const approved = await db.kpiEntry.count({ where: { approvalStatus: "APPROVED" } });
  const pending = await db.kpiEntry.count({ where: { approvalStatus: "PENDING" } });
  const emp = await db.user.findUnique({ where: { email: "employee@zad.org.sa" }, select: { id: true } });
  const empKpis = emp ? await db.kpi.count({ where: { ownerId: emp.id } }) : 0;
  const ew = await runEarlyWarning();

  let created = 0;
  const periods: Period[] = ["Q1", "Q2"];
  for (const period of periods) {
    const entries = await db.kpiEntry.findMany({
      where: { year: 2026, period, approvalStatus: "APPROVED" },
      include: { kpi: { select: { polarity: true } } },
    });
    for (const entry of entries) {
      const target = await db.kpiTarget.findUnique({
        where: { kpiId_year_period: { kpiId: entry.kpiId, year: 2026, period } },
      });
      if (!target) continue;
      const pct =
        achievementPct(entry.actualValue, target.targetValue, entry.kpi.polarity) ??
        entry.achievementPct;
      const status5 = classifyStatus5(entry.actualValue, pct);
      if (status5 !== "partial" && status5 !== "not_achieved") continue;
      const exists = await db.deviationCard.findUnique({
        where: { kpiId_year_period: { kpiId: entry.kpiId, year: 2026, period } },
      });
      if (exists) continue;
      await db.deviationCard.create({
        data: {
          kpiId: entry.kpiId,
          year: 2026,
          period,
          targetValue: target.targetValue,
          actualValue: entry.actualValue,
          deviationPct: deviationPct(pct) ?? 0,
          reasons: "توليد آلي — بيئة تجربة Excel",
          createdById: 1,
        },
      });
      created++;
    }
  }

  console.log(
    JSON.stringify(
      {
        approved,
        pending,
        empKpis,
        earlyWarning: ew,
        deviationCreated: created,
        deviations: await db.deviationCard.count(),
        alerts: await db.earlyWarningAlert.count(),
        notifications: await db.notification.count(),
      },
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
