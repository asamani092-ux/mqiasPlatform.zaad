import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("يجب ضبط DATABASE_URL");
  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const year = 2026;
  const rows = [
    { code: "GOV-01", title: "سياسة الحوكمة المعتمدة", category: "سياسات", owner: "مجلس الإدارة", compliancePct: 100, status: "COMPLIANT" as const },
    { code: "GOV-02", title: "لوائح الصلاحيات والتفويض", category: "لوائح", owner: "الإدارة التنفيذية", compliancePct: 75, status: "PARTIAL" as const },
    { code: "GOV-03", title: "تقارير الامتثال الربعية", category: "تقارير", owner: "وحدة الامتثال", compliancePct: 40, status: "NON_COMPLIANT" as const },
    { code: "GOV-04", title: "مصفوفة المخاطر المؤسسية", category: "مخاطر", owner: "إدارة المخاطر", compliancePct: 0, status: "PENDING" as const },
    { code: "GOV-05", title: "دليل الإفصاح والشفافية", category: "إفصاح", owner: "الاتصال المؤسسي", compliancePct: 90, status: "COMPLIANT" as const },
  ];
  for (const g of rows) {
    await prisma.governanceRequirement.upsert({
      where: { code: g.code },
      update: { ...g, year },
      create: { ...g, year },
    });
  }
  console.log("seeded/updated", rows.length, "governance requirements");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
