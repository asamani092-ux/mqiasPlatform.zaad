/**
 * إصلاح تراكمي: ضمان MeasurementRequirement لكل Kpi.
 * يعمل في الإنتاج بدون tsx: npm run repair:requirements
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function roleToFillerRole(role) {
  if (role === "EMPLOYEE" || role === "SECTION_HEAD" || role === "DEPT_MANAGER") return role;
  return null;
}

async function ensureRequirementFromKpi(db, kpi) {
  let fillerRole;
  if (kpi.ownerId != null) {
    const owner = await db.user.findUnique({
      where: { id: kpi.ownerId },
      select: { role: true },
    });
    const mapped = owner ? roleToFillerRole(owner.role) : null;
    if (mapped) fillerRole = mapped;
  }

  const domain =
    kpi.domain ||
    (kpi.type === "OPERATIONAL" ? "OPERATIONAL" : "STRATEGIC");

  const base = {
    name: kpi.name,
    unit: kpi.unit,
    polarity: kpi.polarity,
    frequency: kpi.frequency,
    requiredData: kpi.requiredData,
    departmentId: kpi.departmentId,
    sectionId: kpi.sectionId,
    ownerId: kpi.ownerId,
    active: kpi.active,
    domain,
  };

  const req = await db.measurementRequirement.upsert({
    where: { code: kpi.code },
    create: {
      code: kpi.code,
      ...base,
      fillerRole: fillerRole ?? "EMPLOYEE",
    },
    update: {
      ...base,
      ...(fillerRole ? { fillerRole } : {}),
    },
  });

  if (kpi.requirementId == null || kpi.requirementId !== req.id) {
    await db.kpi.update({
      where: { id: kpi.id },
      data: { requirementId: req.id },
    });
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL غير معرّف");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  const kpis = await db.kpi.findMany({
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
      domain: true,
      type: true,
    },
  });

  let synced = 0;
  for (const kpi of kpis) {
    await ensureRequirementFromKpi(db, kpi);
    synced++;
  }

  console.log(JSON.stringify({ synced, total: kpis.length }, null, 2));

  await db.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
