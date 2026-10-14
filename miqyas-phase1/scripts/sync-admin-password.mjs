/**
 * مزامنة حساب المشرف من ADMIN_EMAIL / ADMIN_PASSWORD.
 * كلمة مرور اللوحة لا تُحدّث القاعدة إلا عبر البذرة أو هذا السكربت.
 */
import bcrypt from "bcryptjs";
import pg from "pg";

const url = process.env.DATABASE_URL;
const email = (process.env.ADMIN_EMAIL || "admin@zad.org.sa").trim().toLowerCase();
const pass = process.env.ADMIN_PASSWORD?.trim();

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
  const byEmail = await pool.query(
    `SELECT id, email FROM "User" WHERE lower(email) = $1 ORDER BY id ASC LIMIT 1`,
    [email],
  );
  let target = byEmail.rows[0];
  if (!target) {
    const admins = await pool.query(
      `SELECT id, email FROM "User" WHERE role = 'SYSTEM_ADMIN' ORDER BY id ASC`,
    );
    if (admins.rowCount === 1) target = admins.rows[0];
  }

  if (!target) {
    await pool.query(
      `INSERT INTO "User" (name, email, "passwordHash", role, status, "createdAt")
       VALUES ($1, $2, $3, 'SYSTEM_ADMIN', 'ACTIVE', NOW())`,
      ["مشرف النظام", email, hash],
    );
    console.log(JSON.stringify({ ok: true, created: true, email }));
  } else {
    await pool.query(
      `UPDATE "User" SET "passwordHash" = $1, status = 'ACTIVE', role = 'SYSTEM_ADMIN' WHERE id = $2`,
      [hash, target.id],
    );
    console.log(JSON.stringify({ ok: true, updated: true, email: target.email }));
  }
  await pool.query(`DELETE FROM "LoginAttempt" WHERE lower(email) = $1 OR lower(email) = lower($2)`, [
    email,
    target?.email ?? email,
  ]);
} finally {
  await pool.end();
}
