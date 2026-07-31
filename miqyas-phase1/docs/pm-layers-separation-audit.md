# تقرير تقني لمدير المشروع — فصل منطق التحليل عن منطق الإدخال/الاعتماد الطبقي

**المنصة:** مِقياس (`miqyas` v0.1.0)  
**المستودع:** `mqiasPlatform.zaad` · الفرع المرجعي عند الإعداد: `main` @ `fbecd9e`  
**الغرض:** التحقق بأدلة من الكود أن طبقة الإدخال/الاعتماد (الجديدة) منفصلة عن طبقة التحليل/العرض (قديمة الطابع، مرجع meqias)، وتحديد نقطة انعكاسهما.

---

## 1) خريطة الفصل بين الطبقتين

### 1.1 طبقة الإدخال/الاعتماد (الجديدة)

| المسار | صفحة | API | عميل |
|--------|------|-----|------|
| `/my` | `src/app/(app)/my/page.tsx` | `src/app/api/my/measurements/route.ts` · `.../[id]/evidence/route.ts` | `MyKpisClient.tsx` |
| `/dept-follow` | `src/app/(app)/dept-follow/page.tsx` | `src/app/api/dept-follow/route.ts` | `DeptFollowClient.tsx` |
| `/approvals` | `src/app/(app)/approvals/page.tsx` | `src/app/api/approvals/route.ts` | `ApprovalsClient.tsx` |
| إسناد | `src/app/(app)/admin/assign/page.tsx` | `src/app/api/admin/assign/route.ts` | `AssignRequirementsClient.tsx` |

**نماذج Prisma (`prisma/schema.prisma`):**
- `MeasurementRequirement` — المتطلب + `ownerId` + `fillerRole`
- `MeasurementPeriod` — قياس الفترة + `approvalStatus` + `rejectReason` + `reviewFeedback`
- `Evidence` — الشواهد (مرتبطة بـ `measurementPeriodId` و/أو `kpiEntryId`)
- `ApprovalEvent` — سجل تراكمي للإجراءات

**منطق مساعد:** `src/lib/my-measurements.ts` · `approval-status.ts` · `review-feedback.ts` · `review-notify.ts` · `requirement-owner.ts`

### 1.2 طبقة التحليل/العرض (القديمة الطابع / المرجع meqias)

| الملف | الدور |
|-------|-------|
| `src/lib/analytics.ts` → `getKpiRows` | صفوف مؤشرات للمسارات (يقرأ `Kpi` + `KpiEntry`) |
| `src/lib/strategic-analytics.ts` | تجميع بالمحور + شريط أداء الجمعية |
| `src/lib/operational-analytics.ts` | تجميع تشغيلي بالإدارات |
| `src/lib/executive.ts` | لوحة الإدارة العليا |
| `src/lib/dashboard-overview.ts` | ملخص اللوحة الرئيسية |
| `src/lib/status5.ts` · `axis.ts` · `kpi.ts` | عتبات الحالة / المحاور / نسب الإنجاز |

**صفحات المسارات الست:**
1. `src/app/(app)/strategic/page.tsx`
2. `src/app/(app)/operational/page.tsx`
3. `src/app/(app)/early-warning/page.tsx`
4. `src/app/(app)/deviation/page.tsx`
5. `src/app/(app)/governance/page.tsx`
6. `src/app/(app)/knowledge/page.tsx`

(+ `/executive` و`/dashboard` يعتمدان نفس طبقة `KpiEntry`).

### 1.3 نقطة الوصل (الجسر)

**الملف:** `src/lib/measurement-sync.ts`  
**الدالة:** `syncKpiEntriesFromMeasurement(measurementPeriodId)`  
**الكتابة الموحّدة:** `upsertMeasurementPeriod(...)` تستدعي المزامنة في نهايتها (سطر ~182).

```text
# grep call sites
src/lib/measurement-sync.ts:26:export async function syncKpiEntriesFromMeasurement
src/lib/measurement-sync.ts:182:  await syncKpiEntriesFromMeasurement(mp.id);
src/app/api/my/measurements/route.ts          → عبر upsertMeasurementPeriod
src/app/api/my/measurements/[id]/evidence/... → POST/DELETE بعد الرفع/الحذف
src/app/api/dept-follow/route.ts              → update / return_edit / initial_approve
src/app/api/approvals/route.ts                → edit / revoke / final_approve / return_for_edit
src/app/api/entries/route.ts                  → مسار تراثي عبر upsertMeasurementPeriod
```

**ماذا تنسخ المزامنة؟** من `MeasurementPeriod` إلى كل `KpiEntry` للمؤشرات المرتبطة بالمتطلب: القيم، السرد، **`approvalStatus` نفسه**، الاعتماد، سبب الرفض — دون اشتراط أن تكون الحالة نهائية.

---

## 2) إثبات أن الانعكاس للوحات يحدث عند الاعتماد النهائي فقط

### 2.1 هل تُكتب `KpiEntry` فقط عند `FINAL_APPROVED`؟

**لا.** المزامنة تُستدعى عند المسودة والتقديم ورفع/حذف الشاهد ومراجعة الإدارة والاعتماد النهائي.

دليل — نهاية `upsertMeasurementPeriod`:

```182:183:miqyas-phase1/src/lib/measurement-sync.ts
  await syncKpiEntriesFromMeasurement(mp.id);
  return mp;
```

ودليل — رفع شاهد:

```82:82:miqyas-phase1/src/app/api/my/measurements/[id]/evidence/route.ts
    await syncKpiEntriesFromMeasurement(measurementPeriodId);
```

وفي المزامنة يُنسخ `approvalStatus: mp.approvalStatus` إلى `KpiEntry` (إنشاء وتحديث).

### 2.2 هل التحليلات تفلتر `FINAL_APPROVED` فقط؟

**نعم — نصًّا واحدًا `"FINAL_APPROVED"`.**

```52:53:miqyas-phase1/src/lib/analytics.ts
        where: { year: opts.year, period: opts.period, approvalStatus: "FINAL_APPROVED" },
        take: 1,
```

```87:87:miqyas-phase1/src/lib/executive.ts
      approvalStatus: "FINAL_APPROVED",
```

```32:32:miqyas-phase1/src/lib/dashboard-overview.ts
      db.kpiEntry.count({ where: { year, period, approvalStatus: "FINAL_APPROVED" } }),
```

```23:23:miqyas-phase1/src/app/(app)/dashboard/page.tsx
      where: { year, period, approvalStatus: "FINAL_APPROVED" },
```

```28:28:miqyas-phase1/src/app/api/analytics/kpi/[id]/route.ts
          where: { year, approvalStatus: "FINAL_APPROVED" },
```

**الخلاصة لمدير المشروع:**  
- **انعكاس البيانات إلى جدول `KpiEntry`:** مستمر مع كل كتابة على الطبقة الجديدة.  
- **انعكاس البيانات إلى اللوحات/المسارات:** فقط عندما تكون `KpiEntry.approvalStatus === "FINAL_APPROVED"`.

### 2.3 التناقض: `FINAL_APPROVED_STATUSES` مقابل فلتر التحليل

```4:7:miqyas-phase1/src/lib/approval-status.ts
export const FINAL_APPROVED_STATUSES: ApprovalStatus[] = ["FINAL_APPROVED", "APPROVED"];

export function isFinalApproved(status: ApprovalStatus): boolean {
  return status === "FINAL_APPROVED" || status === "APPROVED";
```

استعلامات التحليل **لا تستخدم** `FINAL_APPROVED_STATUSES` ولا `isFinalApproved`؛ تستخدم النص `"FINAL_APPROVED"` فقط.

**أثر بيانات `APPROVED` القديمة:** تختفي من اللوحات/المسارات إن بقيت بحالة `APPROVED` دون ترحيل إلى `FINAL_APPROVED`.

**دليل بيئة التشغيل الحالية (استعلام groupBy):**  
`KpiEntry` و`MeasurementPeriod` لا تحتوي أي صف `APPROVED` (0). الموجود: 143 × `FINAL_APPROVED` + حالات مسودة/تقديم/رفض.  
إذن اليوم اللوحات متسقة مع البيانات الفعلية؛ الخطر يظهر فقط إن وُجدت صفوف تراثية بحالة `APPROVED`.

---

## 3) سلسلة الحالات ومن يملكها

| الحالة | من ينقلها | إلى | الشرط في الكود |
|--------|-----------|-----|----------------|
| *(جديد)* → **DRAFT** | المالك عبر `/api/my/measurements` | `action: "draft"` | `ownerId === userId` + `canFillerEdit` إن وُجد سجل |
| DRAFT / REJECTED_* → **SUBMITTED** | المالك (موظف/رئيس) | `action: "submit"` وغير مدير | `nextStatus = "SUBMITTED"` في `my/measurements/route.ts` ~118–119 |
| DRAFT / REJECTED_* → **INITIAL_APPROVED** | المالك إن كان `DEPT_MANAGER` | تقديم يتخطى الطبقة 2 | `skipDeptInitial` ~116–119 |
| SUBMITTED → **INITIAL_APPROVED** | مدير الإدارة | `action: "initial_approve"` | `dept-follow` + منع الذات |
| SUBMITTED / INITIAL_APPROVED → **DRAFT** | مدير الإدارة | `return_edit` | رفض حقل/شاهد + ملاحظات ≥3 |
| INITIAL_APPROVED → **FINAL_APPROVED** | مشرف النظام | `final_approve` | قبول كل الحقول/الشواهد |
| INITIAL_APPROVED → **REJECTED_WORDING / REJECTED_EVIDENCE / REJECTED** | مشرف | `return_for_edit` | حسب نوع الرفض في `approvals/route.ts` |
| FINAL_APPROVED → **SUBMITTED** أو **DRAFT** | مشرف | `revoke_final` | موظف/رئيس → SUBMITTED؛ تقديم مدير → DRAFT |

### 3.1 قفل الإدخال بعد SUBMITTED

```11:17:miqyas-phase1/src/lib/approval-status.ts
export function canFillerEdit(status: ApprovalStatus): boolean {
  return (
    status === "DRAFT" ||
    status === "REJECTED_WORDING" ||
    status === "REJECTED_EVIDENCE" ||
    status === "REJECTED"
  );
}
```

**SUBMITTED / PENDING / INITIAL_APPROVED / FINAL_APPROVED → `canFillerEdit = false`.**

فرض التعديل في API:

```106:112:miqyas-phase1/src/app/api/my/measurements/route.ts
    if (existing && !canFillerEdit(existing.approvalStatus) && user.role !== "SYSTEM_ADMIN") {
      return jsonError(
        existing.approvalStatus === "SUBMITTED" || existing.approvalStatus === "PENDING"
          ? "القياس مقدَّم بانتظار مراجعة الإدارة — لا يمكن تعديله الآن"
```

فرض رفع الشاهد:

```49:50:miqyas-phase1/src/app/api/my/measurements/[id]/evidence/route.ts
    if (user.role !== "SYSTEM_ADMIN" && !canFillerEdit(mp.approvalStatus)) {
      return jsonError("لا يمكن رفع شواهد والقياس في هذه الحالة", 400);
```

الواجهة: `MyKpisClient` يضبط `locked = !canFillerEdit(status)`.

### 3.2 منع الاعتماد الذاتي

```215:219:miqyas-phase1/src/app/api/dept-follow/route.ts
    if (mp.enteredBy.id === userId || mp.requirement.ownerId === userId) {
      return jsonError(
        "لا يمكن الاعتماد المبدئي لما أدخلته أو تملكه — تقديم المدير يتجاوز هذه الطبقة",
        400
      );
```

---

## 4) تدفق الشواهد (مقابل القرار المعتمد)

**القرار المعتمد:** لا حذف بعد التقديم؛ الحذف فقط في المسودة أو عند الرفض من الإدارة/المشرف.

### 4.1 رفع الشاهد (POST)

| الحالة | مسموح؟ | الدليل |
|--------|--------|--------|
| DRAFT | نعم | `canFillerEdit` = true |
| REJECTED_WORDING / REJECTED_EVIDENCE / REJECTED | نعم | نفس الشرط |
| SUBMITTED / PENDING / INITIAL_APPROVED | **لا** | رفض صريح إن `!canFillerEdit` |
| FINAL_APPROVED / APPROVED | **لا** | نفس الشرط (+ ملكية) |

شرط إضافي: `requirement.ownerId === userId` (أو مشرف).

### 4.2 حذف الشاهد (DELETE)

```117:119:miqyas-phase1/src/app/api/my/measurements/[id]/evidence/route.ts
    if (mp.approvalStatus === "FINAL_APPROVED" || mp.approvalStatus === "APPROVED") {
      return jsonError("لا يمكن حذف الشواهد بعد الاعتماد النهائي", 400);
    }
```

| الحالة | API DELETE | القرار المعتمد | حكم |
|--------|------------|----------------|------|
| DRAFT | مسموح | مسموح | مطابق |
| REJECTED_* | مسموح | مسموح (بعد رفض) | مطابق |
| **SUBMITTED / INITIAL_APPROVED** | **مسموح في API** (لا يفحص `canFillerEdit`) | **ممنوع بعد التقديم** | **انحراف** |
| FINAL_APPROVED | مرفوض | مرفوض | مطابق |

**ملاحظة واجهة:** `MyKpisClient` لا يعرض زر حذف شاهد حالياً (رفع فقط) — الانحراف موجود على مستوى API أكثر من UX.

### 4.3 بعد رفع شاهد بديل إثر `REJECTED_EVIDENCE`

- الرفع لا يغيّر `approvalStatus`؛ يبقى `REJECTED_EVIDENCE`.
- العودة للمسار تتطلب **تقديمًا جديدًا** (`action: "submit"`) → `SUBMITTED` (أو `INITIAL_APPROVED` للمدير).
- **لا انتقال تلقائي** عند الرفع وحده → الحالة لا «تعلق» تقنياً إن أعاد المستخدم التقديم، لكنها تبقى مرفوضة شواهد حتى التقديم.

---

## 5) صحة منطق التحليل الحالي بعد الفصل

| البند | النتيجة | الدليل |
|-------|---------|--------|
| عتبات 1.0 / 0.85 / 0.5 | **مطابق** | `classifyStatus5` في `status5.ts` أسطر 63–66 |
| مصدر المحور | **اشتقاق من أول حرف لرمز الهدف فقط** (ع/م/د/ن) — **لا عمود «المحور» صريح في النموذج** | `axisOf` في `axis.ts`؛ `StrategicGoal` بلا حقل axis في schema |
| قصّ متوسط المحور عند 100% | **مطابق** | `averageAchievementPct` → `Math.min(pct, 100)` |
| شريط «أداء الجمعية» | **موجود** | `axisBarData` يدفع عنصراً `name: "أداء الجمعية"` |
| عدّ مؤشرات المحور | **على كل صفوف `getKpiRows` النشطة في النطاق** (بما فيها بلا قيمة معتمدة → `actual=null` → pending) | `groupByAxis` → `kpiCount: axisRows.length`؛ المصدر كل KPI نشط وليس فقط من له `FINAL_APPROVED` |
| الرسم الزمني في نافذة التحليل | **عبر فترات الدورية للسنة** (`resolvePeriods` → غالباً Q1–Q4 للربعي) مع قيم `FINAL_APPROVED` فقط | `/api/analytics/kpi/[id]` |
| اتساق أعداد الملخص مع البطاقات | **متسق داخلياً** على نفس مصفوفة الصفوف (`strategicSummary.kpiCount = rows.length`)؛ العدد = كل المؤشرات النشطة وليس «المعتمدة فقط» | `strategicSummary` |

**فرق عن مرجع meqias (إن اعتمد العمود الصريح ثم الاشتقاق):** المنصة الحالية **لا تقرأ عمود محور صريح** من الإكسل/قاعدة البيانات؛ الاعتماد كامل على حرف رمز الهدف.

---

## 6) الأمان والتوافق

### 6.1 حراسة الواجهات الأربع

| الواجهة | `requireUser` | `can.*` | Zod | `audit` |
|---------|---------------|---------|-----|---------|
| `/api/my/measurements` | نعم | ملكية + دور تعبئة | `querySchema`/`postSchema` | نعم |
| `/api/dept-follow` | نعم | `can.reviewDepartment` | `patchSchema` | نعم (تحديث/اعتماد) |
| `/api/approvals` | نعم | `can.finalApprove` | `postSchema` | نعم |
| `/api/admin/assign` | نعم | `can.assignRequirements` | `querySchema`/`postSchema` | نعم |

### 6.2 الملكية ودور التعبئة

- كتابة القياس: `requirement.ownerId !== userId` → 403 (`my/measurements/route.ts` ~78).
- رفع شاهد: نفس شرط المالك (~46–47).
- الإسناد: `owner.role !== fillerRole` → 400 (`admin/assign/route.ts`).

### 6.3 المسار التراثي `/api/entries`

**ما زال يقبل الكتابة (POST).**  
إن وُجد `kpi.requirementId`: يكتب عبر `upsertMeasurementPeriod` بحالة **`SUBMITTED` مباشرة** ويتجاوز مسار `/my` الاختياري (لا مسودة، ولا تمييز تقديم المدير).  
إن لم يوجد متطلب: يكتب `KpiEntry` مباشرة بحالة `SUBMITTED` **بدون** `MeasurementPeriod` — التفاف جزئي على الطبقات.

```144:158:miqyas-phase1/src/app/api/entries/route.ts
    // مسار موحّد: إن وُجد متطلب مرتبط نكتب عبر MeasurementPeriod ثم نزامن KpiEntry
    if (kpi.requirementId != null) {
      const mp = await upsertMeasurementPeriod({
        ...
        approvalStatus: "SUBMITTED",
```

واجهة `/my` الحالية لا تستخدم هذا المسار؛ الخطر = عميل قديم أو استدعاء API مباشر.

### 6.4 المعاملات الذرّية `$transaction`

```text
# grep src — db.$transaction
src/app/api/auth/reset-password/route.ts فقط
```

عمليات الاعتماد/الرفض/المزامنة في `/dept-follow` و`/approvals` و`measurement-sync` **ليست** داخل `db.$transaction`. تحديث الحالة + رفض شواهد + مزامنة `KpiEntry` متسلسلة — احتمال تعارض حالة تحت تزامن عالٍ.

---

## 7) الأخطاء المعروفة والانحرافات

1. **مزامنة `KpiEntry` عند كل كتابة** بينما اللوحات تقرأ النهائي فقط — تصميم مقصود للفصل، لكن يجب عدم الخلط بين «نسخ الجدول» و«ظهور اللوحة».
2. **تناقض `APPROVED`:** الثابت `FINAL_APPROVED_STATUSES` يشملها؛ فلاتر التحليل لا تشملها → صفوف تراثية `APPROVED` تختفي من اللوحات (حالياً 0 صفوف في DB التشغيلية).
3. **DELETE شاهد بعد SUBMITTED مسموح في API** رغم القرار «لا حذف بعد التقديم» — انحراف مؤكد.
4. **`/api/entries` POST ما زال مفتوحاً** ويمكنه كتابة `SUBMITTED` متجاوزاً تجربة `/my` الطبقية.
5. **لا `$transaction`** حول الاعتماد/الرفض/المزامنة.
6. **مصدر المحور:** اشتقاق من رمز الهدف فقط — لا عمود محور صريح (فرق محتمل عن مرجع meqias).
7. **عدّ مؤشرات المحور** يشمل غير المعتمدة (pending) ضمن النشطة — إن كان المرجع يعدّ «ذات قيمة معتمدة فقط» فهذا فرق.
8. بعد `REJECTED_EVIDENCE`: لا إعادة فتح تلقائية للمسار؛ يلزم تقديم يدوي (سلوك متوقع إن وُثّق، وإلا يُفهم كـ«تعليق» من منظور المستخدم).

---

## 8) نتيجة البناء وبراهين الجودة الشكلية

### البناء
```text
npm run build → نجاح (Next.js 14.2.5 standalone + postbuild copy-standalone-assets)
```

### إيموجي
```text
rg إيموجي في src → 0 تطابقات (عداد الملفات = 0)
```

### ألوان الرسوم
`src/lib/chart-colors.ts` — قيم **hex فقط** (`#8b1538`, `#f2b824`, …) بلا `rgb()`/`hsl()` داخل الملف.

### «تمكين / Tmkeen» المرئي للمستخدم النهائي
- تعليقات CSS/كود داخلية: `tokens.css` / `components.css` / تعليق `chart-colors.ts` تتضمن اسم نظام التصميم الداخلي **Tmkeen** (ليست نصوص UI ظاهرة).
- اسم إدارة في البيانات: `"الرعاية والتمكين"` في `department-map.ts` (اسم وحدة تنظيمية، ليس علامة منتج).
- لا عبارة منتج ظاهرة «منصة تمكين» في واجهات المستخدم المفحوصة؛ العلامة المعتمدة للمنتج: **مِقياس**.

---

## خلاصة تنفيذية لمدير المشروع

| السؤال | الجواب المختصر |
|--------|----------------|
| هل الطبقتان مفصولتان؟ | **نعم:** إدخال/اعتماد على `Measurement*`؛ تحليل على `Kpi`/`KpiEntry` عبر libs المسارات. |
| نقطة الوصل؟ | `syncKpiEntriesFromMeasurement` في `measurement-sync.ts`. |
| متى تظهر في اللوحات؟ | فقط عند `KpiEntry.approvalStatus = "FINAL_APPROVED"` رغم أن المزامنة أبكر. |
| هل الإدخال يُقفل بعد التقديم؟ | **نعم** للتعديل والرفع عبر `canFillerEdit`؛ **لا بالكامل للحذف عبر API**. |
| أكبر مخاطر التوافق | `/api/entries` الكتابة · حذف الشاهد بعد التقديم في API · غياب `$transaction` · فلتر `APPROVED` التراثي. |

---

*أُعدّ هذا التقرير من فحص مباشر للكود وقاعدة التطوير المحلية في 2026-07-31.*
