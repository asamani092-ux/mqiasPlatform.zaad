# منصة مِقياس — المرحلة 1

منصة قياس الأداء المؤسسي لجمعية الزاد.

## التقنيات

- Next.js 14 (App Router) + TypeScript
- PostgreSQL + Prisma 7
- NextAuth.js 4

## البدء

```bash
cp .env.example .env
# عدّل DATABASE_URL و ADMIN_PASSWORD و NEXTAUTH_SECRET

npm install
npx prisma migrate dev
npm run seed
npm run dev
```

## الأوامر

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل بيئة التطوير |
| `npm run build` | بناء الإنتاج |
| `npm run seed` | بذرة الهيكل التنظيمي |
| `npx prisma validate` | التحقق من المخطط |
