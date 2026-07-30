/**
 * ترحيل تراكمي لحالات الاعتماد الثلاث طبقات + دور التعبئة.
 * PENDING→SUBMITTED · APPROVED→FINAL_APPROVED · REJECTED→REJECTED_WORDING
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  const mpPending = await db.measurementPeriod.updateMany({
    where: { approvalStatus: "PENDING" },
    data: { approvalStatus: "SUBMITTED" },
  });
  const mpApproved = await db.measurementPeriod.updateMany({
    where: { approvalStatus: "APPROVED" },
    data: { approvalStatus: "FINAL_APPROVED" },
  });
  const mpRejected = await db.measurementPeriod.updateMany({
    where: { approvalStatus: "REJECTED" },
    data: { approvalStatus: "REJECTED_WORDING" },
  });

  const kePending = await db.kpiEntry.updateMany({
    where: { approvalStatus: "PENDING" },
    data: { approvalStatus: "SUBMITTED" },
  });
  const keApproved = await db.kpiEntry.updateMany({
    where: { approvalStatus: "APPROVED" },
    data: { approvalStatus: "FINAL_APPROVED" },
  });
  const keRejected = await db.kpiEntry.updateMany({
    where: { approvalStatus: "REJECTED" },
    data: { approvalStatus: "REJECTED_WORDING" },
  });

  // دور التعبئة من دور المالك إن وُجد
  const owned = await db.measurementRequirement.findMany({
    where: { ownerId: { not: null } },
    select: { id: true, owner: { select: { role: true } } },
  });
  let fillerUpdated = 0;
  for (const r of owned) {
    const role = r.owner?.role;
    if (role === "EMPLOYEE" || role === "SECTION_HEAD" || role === "DEPT_MANAGER") {
      await db.measurementRequirement.update({
        where: { id: r.id },
        data: { fillerRole: role },
      });
      fillerUpdated++;
    }
  }

  console.log({
    measurementPeriod: { mpPending, mpApproved, mpRejected },
    kpiEntry: { kePending, keApproved, keRejected },
    fillerUpdated,
  });

  await db.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
