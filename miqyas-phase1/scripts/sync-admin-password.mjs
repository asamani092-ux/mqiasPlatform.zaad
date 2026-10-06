/**
 * مزامنة حساب المشرف من ADMIN_EMAIL / ADMIN_PASSWORD.
 * كلمة مرور اللوحة لا تُحدّث القاعدة إلا عبر البذرة أو هذا السكربت.
 */
import bcrypt from "bcryptjs";
import pg from "pg";

const url = process.env.DATABASE_URL;
const email = (process.env.ADMIN_EMAIL || "admin@zad.org.sa").trim().toLowerCase();
const pass = process.env.ADMIN_PASSWORD;

if (!url) {
  console.error("DATABASE_URL غير معرّف");
  process.exit(1);
}
if (!pass) {
  console.log(JSON.stringify({ skipped: true, reason: "ADMIN_PASSWORD غير معرّف" }));
  process.exit(0);
}

const hash = await bcrypt.hash(pass, 12);
const pool = new pg.Pool({ connectionString: url });

try {
  const existing = await pool.query(`SELECT id FROM "User" WHERE email = $1`, [email]);
  if (existing.rowCount === 0) {
    await pool.query(
      `INSERT INTO "User" (name, email, "passwordHash", role, status, "createdAt")
       VALUES ($1, $2, $3, 'SYSTEM_ADMIN', 'ACTIVE', NOW())`,
      ["مشرف النظام", email, hash],
    );
    console.log(JSON.stringify({ ok: true, created: true, email }));
  } else {
    await pool.query(
      `UPDATE "User" SET "passwordHash" = $1, status = 'ACTIVE' WHERE email = $2`,
      [hash, email],
    );
    console.log(JSON.stringify({ ok: true, updated: true, email }));
  }
  await pool.query(`DELETE FROM "LoginAttempt" WHERE email = $1`, [email]);
} finally {
  await pool.end();
}
