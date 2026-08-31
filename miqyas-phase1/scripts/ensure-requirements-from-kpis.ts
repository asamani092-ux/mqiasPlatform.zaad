/**
 * إصلاح تراكمي: ضمان MeasurementRequirement لكل Kpi عبر ensureRequirementFromKpi.
 * الاستخدام: npx tsx scripts/ensure-requirements-from-kpis.ts
 * أو: npm run repair:requirements
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { ensureRequirementFromKpi } from "../src/lib/kpi-owner-sync";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const kpis = await prisma.kpi.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
      polarity: true,
      frequency: true,
      requiredData: true,
      departmentId: true,
      sectionId: true,
      ownerId: true,
      requirementId: true,
      active: true,
    },
  });

  let synced = 0;
  for (const kpi of kpis) {
    await ensureRequirementFromKpi(kpi, prisma);
    synced++;
  }

  console.log(JSON.stringify({ synced, total: kpis.length }, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
