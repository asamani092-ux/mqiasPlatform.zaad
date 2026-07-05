#!/usr/bin/env bash
# نشر مِقياس على VPS — idempotent, fail-fast
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

echo "==> git pull"
git pull --ff-only

echo "==> npm ci"
npm ci

echo "==> prisma migrate deploy"
npx prisma migrate deploy

echo "==> npm run build"
npm run build

echo "==> نسخ ملفات standalone"
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "==> مجلد الشواهد (خارج المسار العام)"
mkdir -p storage/evidence
chmod 750 storage storage/evidence
ln -sfn "$APP_DIR/storage" "$APP_DIR/.next/standalone/storage"

echo "==> PM2 reload"
set -a
# shellcheck disable=SC1091
[ -f .env ] && . ./.env
set +a
pm2 reload ecosystem.config.js --env production --update-env

echo "==> تم النشر بنجاح"
