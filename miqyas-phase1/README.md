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

## استمرارية البيانات عند إعادة النشر

- **قاعدة PostgreSQL** تحفظ المؤشرات والمتطلبات وفترات القياس وسجلات الشواهد — لا تُمسح بإعادة نشر كود المنصة.
- **ملفات الشواهد** تُخزَّن خارج `public` في `storage/evidence/` (مُستثناة من git).
- عند النشر: اربط مجلدًا دائمًا (volume) إلى `miqyas-phase1/storage` ولا تستبدل قرص التطبيق بملف فارغ، وإلا تُفقد الملفات رغم بقاء الصفوف في القاعدة.
- لا تشغّل `prisma migrate reset` أو `seed` على بيئة إنتاج تحتوي بيانات حقيقية.
