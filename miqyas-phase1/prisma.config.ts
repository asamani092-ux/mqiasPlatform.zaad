import { createRequire } from "node:module";
import { defineConfig, env } from "prisma/config";

try {
  createRequire(import.meta.url)("dotenv/config");
} catch {
  // الإنتاج: DATABASE_URL يأتي من بيئة الحاوية دون حزمة dotenv
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? env("DATABASE_URL"),
  },
});
