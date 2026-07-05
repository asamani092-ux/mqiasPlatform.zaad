#!/usr/bin/env bash
# إعداد محلي سريع — PostgreSQL + .env + migrate + seed + dev
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> PostgreSQL"
if ! pg_isready -h localhost -p 5432 -q 2>/dev/null; then
  sudo pg_ctlcluster 16 main start || sudo -u postgres pg_ctl -D /var/lib/postgresql/16/main start
fi

if [ ! -f .env ] || grep -q "CHANGE_ME" .env 2>/dev/null; then
  echo "==> إنشاء .env"
  DB_PASS="${MIQYAS_DB_PASS:-miqyas_dev_local}"
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<EOF
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'miqyas') THEN
    CREATE USER miqyas WITH PASSWORD '${DB_PASS}';
  ELSE
    ALTER USER miqyas WITH PASSWORD '${DB_PASS}';
  END IF;
END \$\$;
SELECT 'CREATE DATABASE miqyas OWNER miqyas' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'miqyas')\gexec
EOF
  sudo -u postgres psql -d miqyas -c "GRANT ALL ON SCHEMA public TO miqyas;" 2>/dev/null || true
  cat > .env <<EOF
DATABASE_URL="postgresql://miqyas:${DB_PASS}@localhost:5432/miqyas?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
ADMIN_EMAIL="admin@zad.org.sa"
ADMIN_PASSWORD="Admin@123456"
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="miqyas@zad.org.sa"
APP_URL="http://localhost:3000"
CRON_SECRET="$(openssl rand -hex 24)"
EOF
fi

echo "==> prisma generate + migrate"
npx prisma generate
npx prisma migrate deploy || npx prisma db push

echo "==> seed"
npm run seed

echo "==> تنظيف build"
rm -rf .next

echo ""
echo "✅ جاهز. شغّل: npm run dev"
echo "   الدخول: http://localhost:3000/login"
echo "   admin@zad.org.sa / Admin@123456"
echo "   الحوكمة: http://localhost:3000/governance"
