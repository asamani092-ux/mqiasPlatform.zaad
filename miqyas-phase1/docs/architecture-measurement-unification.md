# تقرير هيكلة توحيد القياس والصلاحيات

منصة **مِقياس** — جمعية الزاد.  
الغرض: مصدر قياس واحد (`MeasurementRequirement` / `MeasurementPeriod`) يغذّي المسار الاستراتيجي والتشغيلي، مع تقييد أدوار الإدخال والاعتماد.

---

## 1) خريطة المجلدات والطبقات

```
miqyas-phase1/
├── prisma/
│   ├── schema.prisma          # نموذج البيانات (Requirement/Period/Kpi/Evidence)
│   └── seed.ts                # بذرة الهيكل + إعدادات (منها تفويض الاعتماد)
├── scripts/
│   ├── import-excel-2026.ts   # بذرة التجربة: تعريفات Excel + قياسات افتراضية موحّدة
│   └── migrate-unified-measurement.ts  # ترحيل بيانات قديمة → المصدر الموحّد
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── my/            # إدخال الموظف عبر المتطلبات
│   │   │   ├── dept-follow/   # متابعة إدارة (قراءة) لمدير الإدارة
│   │   │   ├── approvals/     # اعتماد MeasurementPeriod
│   │   │   ├── strategic|operational|…  # مسارات تحليلية على Kpi/KpiEntry
│   │   │   └── admin/         # مستخدمون / مؤشرات / إعدادات
│   │   └── api/
│   │       ├── my/measurements/           # كتابة المصدر الموحّد
│   │       ├── my/measurements/[id]/evidence/
│   │       ├── approvals/                 # اعتماد + مزامنة KpiEntry
│   │       ├── entries/                   # توافق المسارات الحالية
│   │       └── settings/                  # section_head_can_approve / dept_manager_can_approve
│   ├── components/            # MyKpisClient, DeptFollowClient, ApprovalsClient, Settings…
│   ├── lib/
│   │   ├── measurement-sync.ts   # upsert MeasurementPeriod + مزامنة KpiEntry
│   │   ├── my-measurements.ts    # قائمة متطلبات /my
│   │   ├── rbac.ts / nav.ts      # صلاحيات وتنقّل
│   │   └── approval-settings.ts
│   └── middleware.ts          # حصر مسارات الموظف/رئيس القسم/مدير الإدارة
└── docs/
    └── architecture-measurement-unification.md  # هذا التقرير
```

| الطبقة | المسؤولية |
|--------|-----------|
| App Router | صفحات وصلاحية عرض حسب الدور |
| APIs | كتابة على المتطلب؛ قراءة/تحليل عبر المزامنة |
| Prisma | مصدر الحقيقة + إسقاطات KPI |
| RBAC / middleware | تقييد التنقّل والاعتماد |

---

## 2) نموذج البيانات قبل / بعد

### قبل
- الموظف يدخل عبر `Kpi` → `KpiEntry` مباشرة.
- `Evidence` مربوط بـ `kpiEntryId` فقط.
- مؤشر استراتيجي وتشغيلي منفصلان → رفع مزدوج محتمل لنفس المعنى.

### بعد

```
MeasurementRequirement (code فريد)
  ├── MeasurementPeriod (requirementId + year + period)  ← الكتابة + الشواهد
  │     └── Evidence.measurementPeriodId
  ├── Kpi STRATEGIC.requirementId  → KpiEntry (مزامَن) + KpiTarget خاص
  └── Kpi OPERATIONAL.requirementId → KpiEntry (مزامَن) + KpiTarget خاص
```

| الكيان | الدور |
|--------|------|
| `MeasurementRequirement` | تعريف القياس الموحّد (وحدة، قطبية، دورية، إدارة، مالك) |
| `MeasurementPeriod` | فعلي + سرد + اعتماد لفترة واحدة |
| `Evidence` | على الفترة الموحّدة (`measurementPeriodId`؛ `kpiEntryId` اختياري للتوافق) |
| `Kpi.requirementId` | ربط واجهة المسار بالمتطلب |
| `KpiTarget` / `KpiEntry` | مستهدف وإنجاز لكل مؤشر؛ الفعلي يُزامَن من الفترة |

**سياسة المزامنة:** كتابة `/my` → `MeasurementPeriod` + `Evidence` فقط؛ بعد الحفظ تُحدَّث/تُنشأ `KpiEntry` لكل `Kpi` بنفس `requirementId` (`achievementPct` من `KpiTarget` الخاص بالمؤشر).

**ترحيل:** `scripts/migrate-unified-measurement.ts` ينشئ متطلباً لكل KPI، يربطها، ينشئ فترات من الإدخالات، وينقل الشواهد تراكمياً.

---

## 3) مصفوفة الصلاحيات النهائية

| الدور | التنقّل | الإدخال/شواهد | الاطلاع | الاعتماد |
|-------|---------|---------------|---------|----------|
| EMPLOYEE | `/my` (+ إشعارات) | متطلباته (`ownerId`) | لا | لا |
| SECTION_HEAD | `/my`؛ `/approvals` إن `section_head_can_approve=1` | متطلباته | مع التفويض: قسمه في الاعتماد | فقط مع التفويض |
| DEPT_MANAGER | `/my` + `/dept-follow` | متطلباته فقط | متطلبات إدارته (قراءة) | فقط إن `dept_manager_can_approve=1` |
| EXECUTIVE | لوحات + مسارات قراءة | لا | الكل | لا |
| SYSTEM_ADMIN | الكل | نعم | الكل | نعم (الأصل) |

إعدادات: `section_head_can_approve`, `dept_manager_can_approve` في الإعدادات / `SystemSetting`.

---

## 4) تدفق الشاهد مرة واحدة

1. الموظف يفتح `/my` → قائمة `MeasurementRequirement` المسندة.
2. يحفظ فعلي + ماذا/كيف حصل عبر `POST /api/my/measurements` → `MeasurementPeriod`.
3. يرفع شاهداً عبر `/api/my/measurements/[id]/evidence` → `Evidence.measurementPeriodId`.
4. `syncKpiEntriesFromMeasurement` ينسخ الفعلي/السرد/الاعتماد إلى كل `KpiEntry` مرتبط.
5. المسار الاستراتيجي/التشغيلي/لوحات يقرآن `Kpi`/`KpiEntry`؛ الشواهد تُعرض من الفترة الموحّدة (أو التوافق عبر `kpiEntryId` إن وُجد).
6. منصة تشغيلية مستقبلية يمكنها قراءة/كتابة نفس `MeasurementRequirement`/`MeasurementPeriod`.

---

## 5) توافق APIs الحالية ومخاطر الترحيل

| المسار | الحالة |
|--------|--------|
| `/api/my/measurements` | المصدر الجديد للكتابة |
| `/api/my/entries` | قد يبقى للتوافق؛ الكتابة المفضّلة عبر measurements |
| `/api/approvals` | يعمل على `measurementPeriodId` (+ `entryId` legacy يُحلّ للفترة) |
| `/api/entries`, `/api/kpis`, لوحات | تبقى على `Kpi`/`KpiEntry` بعد المزامنة |
| `/api/entries/[id]/evidence` | توافق مؤقت إن لزم؛ المفضّل عبر فترة القياس |

**مخاطر:**
- مؤشرات بلا `requirementId` لن تُزامَن من `/my`.
- شواهد قديمة على `kpiEntryId` فقط تحتاج سكربت الترحيل.
- عيّنات الاعتماد يجب أن تُعلّم `MeasurementPeriod` وليس `KpiEntry` وحده.
- اختلاف مستهدفات الاستراتيجي/التشغيلي مقصود؛ الفعلي مشترك والإنجاز قد يختلف.

---

## 6) إعادة البذرة والتجربة

```bash
cd miqyas-phase1
npm run seed
npm run seed:excel
# اختياري لبيانات قديمة موجودة مسبقاً:
npx tsx scripts/migrate-unified-measurement.ts
npm run build
npm run dev
```

حسابات التجربة:
- مشرف: `admin@zad.org.sa` / `Admin@123456`
- تنفيذي / مدير / رئيس / موظف: `*@zad.org.sa` / `Demo@123456`

تحقق قبول:
- موظف يرى `/my` فقط ويرفع شاهداً لمتطلب واحد.
- مؤشر استراتيجي وتشغيلي على نفس المتطلب يعرضان نفس الشواهد/الفعلي.
- مشرف يعتمد؛ رئيس قسم فقط مع التفويض؛ مدير إدارة يطّلع دون اعتماد افتراضياً.
- هذا التقرير موجود تحت `docs/`.

---

## 7) ملحق — النشر السحابي (مرحلة لاحقة، غير منفَّذة هنا)

قائمة تحقق فقط بعد نجاح التجربة المحلية:

- [ ] ربط المستودع بالسيرفر السحابي
- [ ] PostgreSQL إنتاج + نسخ احتياطي
- [ ] بناء/تشغيل التطبيق عبر Docker (أو ما يعادله)
- [ ] دومين + TLS
- [ ] أسرار `.env` إنتاج (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, …)
- [ ] منافذ وجدار ناري
- [ ] `prisma migrate deploy` / `db push` حسب سياسة الإنتاج
- [ ] إعادة بذرة أو ترحيل بيانات الإنتاج بحذر

لا يُنفَّذ النشر في هذه الجولة.
