#!/bin/sh
# إقلاع حاوية مِقياس: هجرة Prisma ثم تشغيل Next standalone
set -e

export HOSTNAME=0.0.0.0
export HOST=0.0.0.0

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

echo "==> تشغيل الخادم"
exec node server.js
