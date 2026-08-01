#!/usr/bin/env node
/**
 * حارس baseline قبل `prisma migrate deploy`:
 * إن كانت القاعدة تحمل المخطط مسبقًا (db push أو migrations قديمة)
 * ولم يُسجَّل baseline بعد → يعلّمه كمُطبَّق بدل إعادة بنائه (وإلا فشل النشر).
 * القواعد الفارغة تُترك لـ migrate deploy يبنيها كاملة.
 */
const { execSync } = require("child_process");
const { Client } = require("pg");
require("dotenv").config();

const BASELINE = "20260801000000_baseline";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[baseline] DATABASE_URL غير مضبوط — تخطٍّ");
    return;
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const schemaExists = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User' LIMIT 1`,
    );
    if (schemaExists.rowCount === 0) {
      console.log("[baseline] قاعدة جديدة — migrate deploy سيبنيها من baseline");
      return;
    }
    const applied = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations' LIMIT 1`,
    );
    if (applied.rowCount > 0) {
      const row = await client.query(
        `SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL LIMIT 1`,
        [BASELINE],
      );
      if (row.rowCount > 0) {
        console.log("[baseline] مسجَّل مسبقًا — لا إجراء");
        return;
      }
    }
    console.log("[baseline] مخطط قائم بلا baseline مسجَّل — يُعلَّم كمُطبَّق");
    execSync(`npx prisma migrate resolve --applied ${BASELINE}`, { stdio: "inherit" });
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[baseline] فشل الحارس:", e.message);
  process.exit(1);
});
