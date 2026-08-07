<<<<<<< HEAD
# أمر الوكيل — ربط المنصة بنظام التصميم المركزي وتحسين الواجهة

> الصق هذا الملف كاملاً كتعليمات لوكيل Cursor على مستودع المنصة المستهدفة.
=======
# أمر الوكيل — تحسين واجهة المنصة بالمكوّنات الإضافية

> الصق محتوى «نص النسخ للوكيل» أدناه في محادثة وكيل كل منصة، أو نفّذ هذا الملف كاملاً.
>>>>>>> origin/cursor/zaad-design-system-ad33

---

## ماذا حصل (السياق)

<<<<<<< HEAD
1. **مصدر الحقيقة الوحيد** أصبح المستودع: `asamani092-ux/designSystemFinal` (الحزمة `@zaad/design-system`).
2. نُسخ التصميم المحلية داخل المنصات (`Design_system_f` / `Zaad.design.system` / `design-system` المنسوخة) **ملغاة** ويجب حذفها بعد الربط.
3. أي تحسين لاحق على التوكنات أو عقود المكوّنات يتم في `designSystemFinal` فقط، ثم ينعكس على المنصات برفع إصدار الاعتمادية.
4. المنصات المعتمدة لهذا الربط:
   - `asamani092-ux/redaPlatform.zaad`
   - `asamani092-ux/mqiasPlatform.zaad`
   - `asamani092-ux/itsalplatform.zaad`
   - `asamani092-ux/tkafulPlatform.zaad`
   - `asamani092-ux/tmkeenpPlatform.zaad`

## تحليل الخوارزمية (إلزامي قبل التنفيذ)

- **الزمن:** ربط المنصة O(1) خطوات ثابتة؛ مسح الشاشات واستبدال الأنماط O(S) حيث S = عدد صفحات/مكوّنات الواجهة.
- **المكان:** لا تُنسخ ملفات التصميم داخل المنصة؛ الاعتمادية فقط → O(1) مساحة إضافية مقابل النسخ السابقة.

## مهمتك على هذه المنصة (نفّذ بالترتيب)

### أ) الربط التقني

1. أضف الاعتمادية في `package.json`:
=======
1. مصدر التصميم الوحيد: `asamani092-ux/designSystemFinal` → الحزمة `@zaad/design-system` (`#v1.2.0`).
2. النسخ المحلية (`Design_system_f` / `Zaad.design.system` / `design-system` المكرر) تُحذف بعد الربط.
3. **المهمة الأساسية:** تحسين واجهات هذه المنصة باستخدام **المكوّنات الإضافية** من دليل الهوية (من ٦·٩ فما فوق) وعقود `components.md` — وليس مجرد استيراد CSS.
4. المنصات: `redaPlatform` · `mqiasPlatform` · `itsalplatform` · `tkafulPlatform` · `tmkeenpPlatform`.

## تحليل الخوارزمية (إلزامي قبل التنفيذ)

- **الزمن:** الربط O(1)؛ جرد الشاشات وتطبيق المكوّنات الإضافية O(S×C) حيث S=الشاشات وC=المكوّنات المطبقة لكل شاشة.
- **المكان:** اعتمادية واحدة بلا نسخ محلية → O(1).

## المكوّنات الإضافية المطلوب تطبيقها (حسب حاجة الشاشات)

طبّق ما ينطبق على شاشات المنصة فقط — لا تُنشئ شاشات وهمية:

| المجموعة | المكوّنات |
|----------|-----------|
| ٦·٩ إضافية | Breadcrumb · Chips/Tags · AvatarGroup · Modal · Stepper · Accordion · EmptyState · Pagination |
| ٦·١٠–١١ | بطاقة عرض تفصيلي · بطاقة مستفيد · معاينة جوال |
| ٦·١٢ | شاشات المصادقة / إدارة الحساب بنفس العقود والأنماط |
| ٦·١٣ موسّعة | Toast · Tabs segmented · FilterBar · ConfirmDialog · Skeleton |
| ٦·١٤ | Profile Drawer / SlideOver (RTL من `inline-start`) |
| ٦·١٥–١٧ | رأس تقرير · معايير · جداول تقارير · TaskCard · نماذج مهام/استبيان/استقبال طلبات إن وُجدت في المنصة |
| من العقود | Button · TextField · Select · Badge · Card · DataTable · Sidebar · TopBar · KPI · Progress · Dropzone |

المرجع: `@zaad/design-system/components.md` + أقسام المكوّنات في دليل الهوية بالمستودع المركزي.

---

## نص النسخ للوكيل (انسخه كاملاً)

```text
اقرأ AGENT_COMMAND.md في جذر هذا المستودع ونفّذه بالكامل.

الهدف الرئيسي: تحسين واجهة هذه المنصة باستخدام المكوّنات الإضافية من نظام الزاد الموحّد — ليس استيراد ملفات فقط.

نفّذ بالترتيب:
1) اربط الحزمة:
   "@zaad/design-system": "github:asamani092-ux/designSystemFinal#v1.2.0"
   ثم tokens.css + components.css + tailwind.preset + class zad-root و dir=rtl.
2) احذف Design_system_f و Zaad.design.system وأي design-system محلي مكرر بعد نجاح البناء.
3) اجرد شاشات الواجهة الحالية (صفحات، نماذج، جداول، لوحات، أدراج، نوافذ).
4) حسّن كل شاشة ذات صلة بالمكوّنات الإضافية التالية حيث تنطبق:
   Breadcrumb, Chips/Tags, AvatarGroup, Modal/Dialog, Stepper, Accordion,
   EmptyState, Pagination, بطاقة عرض تفصيلي, بطاقة مستفيد,
   Toast, Tabs, FilterBar, ConfirmDialog, Skeleton,
   Profile Drawer/SlideOver, DataTable, Badge, Card, KPI, Progress, Dropzone,
   ونماذج المهام/الاستبيان/استقبال الطلبات إن وُجدت في المنصة.
5) التنفيذ الداخلي فقط: لا تغيّر أسماء الدوال أو المعاملات المربوطة بالـ UI.
6) كل لون/مسافة/ظل من var(--*) أو فئات النظام — ممنوع قيم صريحة.
7) RTL منطقي (text-start / inline-start) + وصول (تركيز مرئي، تباين، لمس ≥ 44px).
8) اقرأ العقود من node_modules/@zaad/design-system/components.md قبل تنفيذ أي مكوّن.
9) npm install && npm run build يجب أن ينجح.
10) فرع + commit + push + PR يذكر: الربط، الحذف، وقائمة الشاشات والمكوّنات الإضافية التي طُبّقت.

قبل أي كود: اذكر Big O (الزمن/المكان). إن نقص معطى تقني توقف واسأل — لا تخمّن.
لا تنسخ ملفات التصميم داخل المنصة. لا توسّع API أو قاعدة البيانات.
```

---

## أ) الربط التقني

1. أضف في `package.json`:
>>>>>>> origin/cursor/zaad-design-system-ad33

```json
"@zaad/design-system": "github:asamani092-ux/designSystemFinal#v1.2.0"
```

<<<<<<< HEAD
2. اربط Tailwind:

```ts
import zaadPreset from "@zaad/design-system/tailwind.preset";
export default { presets: [zaadPreset], content: [/* مسارات المشروع */] };
```

3. في ملف الأنماط العام (`globals.css` أو ما يعادله):
=======
2. Tailwind: `presets: [zaadPreset]` من `@zaad/design-system/tailwind.preset`.
3. في الأنماط العامة:
>>>>>>> origin/cursor/zaad-design-system-ad33

```css
@import "@zaad/design-system/tokens.css";
@import "@zaad/design-system/components.css";
```

<<<<<<< HEAD
4. على الجذر: `lang="ar" dir="rtl"` و class `zad-root` (أو أبقِ `tmkeen-root` مؤقتاً — التوافق موجود).

5. احذف المجلدات المحلية المنسوخة بعد نجاح البناء:
   - `Design_system_f`
   - `Zaad.design.system`
   - أي `design-system/` محلي مكرر (ليس استيراد الحزمة)

6. نفّذ `npm install` ثم `npm run build` وتأكد من نجاح البناء.

### ب) تحسين الواجهة بالمكوّنات الجديدة

1. اقرأ عقد المكوّنات من الحزمة: `@zaad/design-system/components.md` (أو من المستودع المركزي `package/components.md`).
2. **ثبات الواجهات:** لا تُغيّر أسماء الدوال/المعاملات المربوطة بالـ UI؛ عدّل التنفيذ الداخلي والأنماط فقط.
3. استبدل الألوان والقيم الصريحة بـ `var(--*)` من التوكنات أو فئات النظام (`.btn-primary`, `.card`, `.badge-*`, `.input-field`, …).
4. طبّق عقود المكوّنات (Button / TextField / Select / Card / Badge / Modal / Drawer / Table / Tabs …) حسب الشاشات الموجودة — حالة واحدة لكل عنصر: default / hover / focus-visible / disabled / loading / error حيث تنطبق.
5. التزم بـ RTL المنطقي: `inline-start/end` و `text-start` — ممنوع `left/right` للمحتوى العربي.
6. الوصول شرط قبول: تباين، تركيز مرئي، لمس ≥ 44px، عناصر أصلية أو ARIA مطابق.
7. نطاق الدقة: عدّل ملفات الواجهة والأنماط فقط؛ لا توسّع نطاق الـ API/قاعدة البيانات.

### ج) التسليم

1. فرع: `cursor/consume-zaad-design-<وصف>-6d93` (أو وفق سياسة المستودع).
2. Commit يوضح: ربط `@zaad/design-system` + حذف النسخ المحلية + تحسين الشاشات حسب العقود.
3. Push + PR مع قائمة الشاشات التي حُسّنت.

## ممنوع

- إعادة نسخ ملفات التصميم داخل المنصة.
- قيم لون/مسافة صريحة بدل التوكنات.
- كسر واجهات المكوّنات العامة (إعادة تسمية props/دوال مربوطة).
- تخمين متطلبات غير موجودة في العقود أو في شاشات المنصة.
=======
4. الجذر: `lang="ar" dir="rtl"` + `zad-root`.
5. احذف النسخ المحلية بعد نجاح البناء.
6. `npm install` ثم `npm run build`.

## ب) تحسين الواجهة بالمكوّنات الإضافية

1. اقرأ `components.md` من الحزمة قبل التنفيذ.
2. **ثبات الواجهات:** لا إعادة تسمية props/دوال مربوطة بالـ UI.
3. استبدل الأنماط المخصصة بمكوّنات/فئات النظام + توكنات.
4. لكل مكوّن إضافي طُبّق: الحالات default / hover / focus-visible / disabled / loading / error / empty حيث تنطبق.
5. Drawer يفتح من `inline-start` في RTL.
6. نطاق الدقة: ملفات الواجهة والأنماط فقط.

## ج) التسليم

1. فرع حسب سياسة المستودع.
2. Commit: ربط الحزمة + حذف النسخ + تطبيق المكوّنات الإضافية على الشاشات.
3. PR فيه جدول: الشاشة → المكوّنات الإضافية المطبّقة.

## ممنوع

- نسخ ملفات التصميم داخل المنصة.
- قيم لون/مسافة صريحة.
- كسر واجهات المكوّنات العامة.
- تخمين شاشات أو مكوّنات غير موجودة في المنصة.
>>>>>>> origin/cursor/zaad-design-system-ad33
