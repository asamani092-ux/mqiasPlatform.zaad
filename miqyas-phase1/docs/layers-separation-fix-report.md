# تقرير تنفيذ موحّد — منهج فصل التحليل عن الاعتماد الطبقي

**المرجع:** `docs/pm-layers-separation-audit.md`  
**الفرع:** `cursor/layers-separation-fix-ad33` → دُمج في `main`  
**البناء النهائي:** `npm run build` ناجح  
**تاريخ التنفيذ:** 2026-07-31

---

## STEP 1 — حصر المزامنة على الاعتماد النهائي

**الملفات:** `src/lib/measurement-sync.ts` · `scripts/cleanup-nonfinal-kpi-entries.ts`

**الشرط الجديد:**
```ts
if (!isFinalApproved(mp.approvalStatus)) {
  // فك ربط Evidence.kpiEntryId ثم deleteMany لـ KpiEntry
  return { synced: 0, removed };
}
// وإلا upsert مع approvalStatus: "FINAL_APPROVED"
```

**إثبات قاعدة البيانات:**
```text
BEFORE: DRAFT=3, SUBMITTED=6, REJECTED_*=2, FINAL_APPROVED=143
AFTER cleanup/sync: [{"approvalStatus":"FINAL_APPROVED","_count":143}]
```

**البناء:** ناجح بعد الخطوة.

---

## STEP 2 — توحيد فلتر الحالة النهائية

**الملفات:**  
`analytics.ts` · `executive.ts` · `dashboard-overview.ts` · `dashboard/page.tsx` · `cron-jobs.ts` · `api/deviation/route.ts` · `api/deviation/generate/route.ts` · `api/analytics/kpi/[id]/route.ts`

**النمط الموحّد:**
```ts
approvalStatus: { in: [...FINAL_APPROVED_STATUSES] }
```

**grep:** لا توجد استعلامات تحليلية بنص `"FINAL_APPROVED"` مفرد؛ المتبقي فقط كتابة المزامنة (`measurement-sync`) ونوع استيراد الإكسل.

**البناء:** ناجح.

---

## STEP 3 — منع حذف الشواهد بعد التقديم

**الملف:** `src/app/api/my/measurements/[id]/evidence/route.ts`

```ts
if (!canFillerEdit(mp.approvalStatus)) {
  return jsonError(
    "لا يمكن حذف الشواهد بعد التقديم — الحذف متاح في المسودة أو بعد الإرجاع/الرفض فقط",
    400
  );
}
```

**الحالات الممنوعة:** SUBMITTED · PENDING · INITIAL_APPROVED · FINAL_APPROVED · APPROVED  
**المسموح:** DRAFT · REJECTED_WORDING · REJECTED_EVIDENCE · REJECTED

**البناء:** ناجح.

---

## STEP 4 — حذف ناعم للشواهد

**الملفات:** نفس مسار evidence · `my-measurements.ts` · `dept-follow/page.tsx` · `approvals` GET · `analytics/kpi/[id]`

بدل `db.evidence.delete` + `unlink`:
```ts
await db.evidence.update({
  data: {
    status: "REJECTED",
    rejectReason: "حُذف من المدخل",
    rejectedById: userId,
    rejectedAt: new Date(),
  },
});
// softDeleted: true
```

الاستعلامات تعرض/تَعُدّ `where: { status: "ACTIVE" }` فقط.

**البناء:** ناجح.

---

## STEP 5 — إغلاق حلقة REJECTED_EVIDENCE

**الملف:** `src/components/MyKpisClient.tsx`

مسار المالك:
1. يرى تنبيهًا أعلى الصفحة عند وجود حالات رفض.
2. يفتح التفاصيل → **ملاحظات القسم / المشرف** حقلًا حقلًا وشاهدًا شاهدًا.
3. يصحّح ويرفع شاهدًا بديلًا (الرفع وحده لا يغيّر الحالة).
4. يضغط **إعادة التقديم** / **إعادة التقديم بعد التصحيح** → `action: submit` → SUBMITTED (أو INITIAL_APPROVED للمدير).

**البناء:** ناجح.

---

## STEP 6 — معاملات ذرّية + إعادة فحص الحالة

**الملفات:** `api/approvals/route.ts` · `api/dept-follow/route.ts` · `api-helpers.ts` (`StatusConflictError` → 409) · دعم `tx` في `sync` و`recordApprovalEvent` و`rebindOwnerIfMissing`

| المسار | داخل `$transaction` | إعادة فحص |
|--------|---------------------|-----------|
| final_approve | نعم | `=== INITIAL_APPROVED` وإلا 409 |
| return_for_edit | نعم | `=== INITIAL_APPROVED` وإلا 409 |
| revoke_final | نعم | FINAL/APPROVED وإلا 409 |
| initial_approve | نعم | SUBMITTED/PENDING وإلا 409 |
| return_edit (إدارة) | نعم | `canDeptReturn` وإلا 409 |

**البناء:** ناجح.

---

## STEP 7 — تنظيف approvedById عند الرفض

**الملف:** `api/approvals/route.ts` · `return_for_edit`

```ts
approvedById: null,
approvedAt: null,
initialApprovedById: null,
initialApprovedAt: null,
```

`approvedById` يُملأ فقط في `final_approve`.

**البناء:** ناجح.

---

## STEP 8 — تحييد كتابة `/api/entries`

**الملفات:** `api/entries/route.ts` · `api/entries/[id]/evidence/route.ts`

```ts
POST/PUT/DELETE → 410 "استخدم مسار القياسات الموحّد"
```

GET بقي للقراءة مع فلتر شواهد ACTIVE.

**البناء:** ناجح.

---

## معايير القبول النهائية

| المعيار | الحالة |
|---------|--------|
| لا صف KpiEntry إلا FINAL_APPROVED | ✅ (143 صفًا كلها نهائية بعد التنظيف) |
| التحليل يستخدم FINAL_APPROVED_STATUSES | ✅ |
| لا حذف شواهد بعد التقديم + حذف ناعم | ✅ |
| مسار واضح من REJECTED_EVIDENCE | ✅ |
| اعتماد/رفض داخل $transaction + 409 | ✅ |
| approvedById فارغ عند الرفض | ✅ |
| /api/entries لا يقبل كتابة | ✅ 410 |
| build ناجح · 0 إيموجي · hex في chart-colors | ✅ |
| لا «تمكين/Tmkeen» منتج ظاهر | ✅ (تعليقات CSS داخلية فقط) |

---

## خارج النطاق (موثّق ولم يُنفَّذ)

- عمود محور صريح من الإكسل.
- قيمة enum `REMOVED` منفصلة للشواهد (اكتُفي بـ `REJECTED` + سبب «حُذف من المدخل»).
