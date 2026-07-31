import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { syncKpiEntriesFromMeasurement } from "../src/lib/measurement-sync";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const before = await db.kpiEntry.groupBy({ by: ["approvalStatus"], _count: true });
  console.log("BEFORE", JSON.stringify(before));

  const nonFinal = await db.measurementPeriod.findMany({
    where: { approvalStatus: { notIn: ["FINAL_APPROVED", "APPROVED"] } },
    select: { id: true },
  });
  let removed = 0;
  for (const mp of nonFinal) {
    const r = await syncKpiEntriesFromMeasurement(mp.id);
    removed += r.removed ?? 0;
  }
  const orphanDel = await db.kpiEntry.deleteMany({
    where: { approvalStatus: { notIn: ["FINAL_APPROVED", "APPROVED"] } },
  });
  console.log("sync_removed", removed, "orphan_delete", orphanDel.count);

  const after = await db.kpiEntry.groupBy({ by: ["approvalStatus"], _count: true });
  console.log("AFTER", JSON.stringify(after));
}

main()
  .then(() => db.$disconnect().then(() => pool.end()))
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    await pool.end();
    process.exit(1);
  });
