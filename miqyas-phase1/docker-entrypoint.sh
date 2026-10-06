#!/bin/sh
# إقلاع حاوية مِقياس: هجرة Prisma ثم تشغيل Next standalone
set -e

export HOSTNAME=0.0.0.0
export HOST=0.0.0.0
export NODE_PATH="/opt/prisma-cli/node_modules${NODE_PATH:+:$NODE_PATH}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "تحذير: DATABASE_URL غير معرّف — تُتخطى الهجرة"
else
  PRISMA_BIN=""
  if [ -x /opt/prisma-cli/node_modules/.bin/prisma ]; then
    PRISMA_BIN=/opt/prisma-cli/node_modules/.bin/prisma
  elif [ -x ./node_modules/.bin/prisma ]; then
    PRISMA_BIN=./node_modules/.bin/prisma
  fi

  if [ -n "$PRISMA_BIN" ]; then
    echo "==> prisma migrate deploy"
    "$PRISMA_BIN" migrate deploy
  else
    echo "تحذير: prisma CLI غير متوفر — تُتخطى الهجرة"
  fi
fi

if [ -n "${ADMIN_PASSWORD:-}" ] && [ -f /app/scripts/sync-admin-password.mjs ]; then
  echo "==> مزامنة حساب المشرف من البيئة"
  node /app/scripts/sync-admin-password.mjs || echo "تحذير: فشلت مزامنة المشرف"
fi

echo "==> تشغيل الخادم"
exec node server.js
