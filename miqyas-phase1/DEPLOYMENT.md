# دليل نشر منصة مِقياس — الإنتاج

دليل خطوة بخطوة لنشر المنصة على **سيرفر VPS واحد** (Ubuntu) يستضيف Next.js + PostgreSQL، مع Nginx وPM2 ونشر تلقائي من GitHub.

---

## 1. متطلبات السيرفر

| المكوّن | الإصدار الموصى به |
|---------|---------------------|
| Ubuntu | 22.04 LTS أو أحدث |
| Node.js | 20 LTS |
| PostgreSQL | 15+ |
| Nginx | أحدث stable |
| PM2 | `npm i -g pm2` |
| Git | 2.x |

```bash
# Node 20 (مثال عبر NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx postgresql postgresql-contrib git
sudo npm install -g pm2
```

---

## 2. PostgreSQL — قاعدة ومستخدم بصلاحيات محدودة

```bash
sudo -u postgres psql
```

```sql
CREATE USER miqyas WITH PASSWORD 'كلمة_سر_قوية';
CREATE DATABASE miqyas OWNER miqyas;
GRANT CONNECT ON DATABASE miqyas TO miqyas;
\c miqyas
GRANT USAGE ON SCHEMA public TO miqyas;
GRANT CREATE ON SCHEMA public TO miqyas;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO miqyas;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO miqyas;
\q
```

**صيغة `DATABASE_URL`:**

```
postgresql://miqyas:كلمة_السر@localhost:5432/miqyas?schema=public
```

> **أمان:** اربط PostgreSQL بـ `localhost` فقط في `postgresql.conf` / `pg_hba.conf` — لا تفتح المنفذ 5432 للإنترنت.

---

## 3. استنساخ المستودع وملف `.env`

```bash
sudo mkdir -p /var/www/miqyas
sudo chown "$USER:$USER" /var/www/miqyas
cd /var/www/miqyas
git clone https://github.com/asamani092-ux/mqiasPlatform.zaad.git .
cd miqyas-phase1
cp .env.example .env
nano .env
```

### شرح المتغيرات

| المتغير | الوصف |
|---------|--------|
| `DATABASE_URL` | اتصال PostgreSQL (أعلاه) |
| `NEXTAUTH_URL` | `https://SUBDOMAIN.example.org` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | حساب المشرف الأول (للبذرة فقط) |
| `SMTP_HOST` | `smtp.office365.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` / `SMTP_PASS` | حساب Outlook/365 (كلمة مرور تطبيق إن لزم) |
| `SMTP_FROM` | عنوان المرسل (مثال: `miqyas@zad.org.sa`) |
| `APP_URL` | نفس عنوان الموقع العام |
| `CRON_SECRET` | `openssl rand -hex 24` — يحمي `/api/cron` |

> **GitHub Actions (اختياري):** أضف أسرار `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_APP_PATH` (= `/var/www/miqyas/miqyas-phase1`) — لا تضعها في `.env`.

---

## 4. أول تشغيل — migrations + seed

```bash
cd /var/www/miqyas/miqyas-phase1
npm ci
npx prisma migrate deploy
# اضبط ADMIN_EMAIL و ADMIN_PASSWORD في .env أولاً
npm run seed
npm run build
mkdir -p storage/evidence && chmod 750 storage storage/evidence
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
ln -sfn "$(pwd)/storage" .next/standalone/storage
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # نفّذ الأمر الذي يطبعه PM2
```

**بعد أول دخول:** غيّر كلمة مرور المشرف من لوحة النظام أو مباشرة في قاعدة البيانات.

---

## 5. PM2

```bash
pm2 status
pm2 logs miqyas
pm2 reload ecosystem.config.js --env production --update-env
```

- **instances: 1** — لا تزيد إلا بعد التأكد من عدم الاعتماد على ذاكرة الخادم بين الطلبات.
- التطبيق يعمل على `127.0.0.1:3000` داخل `.next/standalone`.

---

## 6. Nginx + HTTPS

```bash
sudo cp nginx/miqyas.conf /etc/nginx/sites-available/miqyas
sudo nano /etc/nginx/sites-available/miqyas   # استبدل SUBDOMAIN.example.org
sudo ln -s /etc/nginx/sites-available/miqyas /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d SUBDOMAIN.example.org
```

تأكد من تمرير `X-Forwarded-For` و `X-Real-IP` (موجودان في القالب) لتسجيل IP تسجيل الدخول.

---

## 7. DNS

أنشئ **سجل A** للنطاق الفرعي:

```
miqyas.zad.org.sa  →  IP_السيرفر
```

انتظر انتشار DNS ثم شغّل certbot.

---

## 8. Crontab — مهام الإنذار والتصعيد

```bash
crontab -e
```

```cron
# مِقياس — إنذار مبكر + تصعيد إجراءات متأخرة (06:00 يومياً)
0 6 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://SUBDOMAIN.example.org/api/cron >> /var/log/miqyas-cron.log 2>&1
```

> **مهم:** ضع `CRON_SECRET` في ملف env للمستخدم أو استبدل `$CRON_SECRET` بالقيمة مباشرة في crontab.
>
> **ما يفعله `/api/cron`:**
> 1. **runEarlyWarning** — في الشهر الثالث من كل ربع، يفحص KPIs الربعية ويُنشئ `EarlyWarningAlert` عند تجاوز فجوة الأداء.
> 2. **escalateLateActions** — يُصعّد الإجراءات التصحيحية المتأخرة إلى `LATE` ويُشعر المشرفين.

---

## 9. استيراد بيانات 2026

1. سجّل دخول كـ **SYSTEM_ADMIN**.
2. افتح `/admin/import`.
3. ارفع ملف Excel (قياس الأداء الاستراتيجي والتشغيلي).
4. راجع **المعاينة** (رموز KPI + تنبيهات الأرباع الناقصة).
5. اضغط **تأكيد** — يُرسل الصفوف المعالجة للخادم (بدون cache في الذاكرة).

---

## 10. النشر التلقائي (GitHub Actions)

عند الدفع إلى `main`، workflow `.github/workflows/deploy.yml` يتصل بالـ VPS وينفّذ `./deploy.sh`:

1. `git pull`
2. `npm ci`
3. `npx prisma migrate deploy`
4. `npm run build`
5. نسخ static/public + ربط `storage`
6. `pm2 reload`

---

## 11. قائمة تحقق أمنية نهائية

- [ ] `.env` **خارج Git** — `chmod 600 .env`
- [ ] **UFW:** `sudo ufw allow 22,80,443/tcp && sudo ufw enable`
- [ ] PostgreSQL على **localhost** فقط
- [ ] `storage/evidence` **خارج** `public/` — صلاحيات `750`، مالك مستخدم التطبيق
- [ ] `NEXTAUTH_SECRET` و `CRON_SECRET` عشوائيان وقويان
- [ ] تغيير كلمة مرور المشرف بعد أول دخول
- [ ] **نسخ احتياطي دوري:**

```bash
# مثال يومي 02:00
0 2 * * * pg_dump -U miqyas -h localhost miqyas | gzip > /var/backups/miqyas-$(date +\%F).sql.gz
```

- [ ] مراجعة `/var/log/miqyas-cron.log` دورياً
- [ ] SMTP بكلمة مرور تطبيق (ليس كلمة المرور الرئيسية)

---

## 12. استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| 502 Bad Gateway | `pm2 status` — تأكد أن التطبيق يعمل على 3000 |
| فشل migrate | تحقق من `DATABASE_URL` وصلاحيات المستخدم |
| البريد لا يُرسل | راجع `EmailLog` في القاعدة وإعدادات SMTP |
| cron 401 | تطابق `CRON_SECRET` في `.env` و crontab |
| الشواهد لا تُرفع | تأكد من symlink `storage` في standalone |

---

**الدعم:** مكتب الأداء / إدارة المشاريع — جمعية الزاد
