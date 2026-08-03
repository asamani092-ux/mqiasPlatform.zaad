/** نموذج تقييم الأدوار والصلاحيات — مكمّل لقائمة الأدوات (uat-tools) */

export type UatRoleVerdict = "غير مجرّب" | "مطابق" | "يحتاج تحسين" | "خلل";

export type UatRoleCase = {
  id: string;
  /** رقم الحالة داخل القسم */
  n: number;
  title: string;
  /** أبعاد التحقق: رؤية / وصول / نطاق */
  dimensions: Array<"رؤية" | "وصول" | "نطاق">;
  steps: string[];
  expected: string;
};

export type UatRoleSection = {
  id: string;
  title: string;
  roleLabel: string;
  /** حساب تجريبي مقترح */
  demoHint: string;
  goldenRule: string;
  cases: UatRoleCase[];
};

export const UAT_ROLE_VERDICTS: UatRoleVerdict[] = [
  "غير مجرّب",
  "مطابق",
  "يحتاج تحسين",
  "خلل",
];

export const UAT_ROLES_STORAGE_KEY = "miqyas.uat.roles.v1";

export const UAT_ROLE_SECTIONS: UatRoleSection[] = [
  {
    id: "employee",
    title: "1) الموظف",
    roleLabel: "EMPLOYEE",
    demoHint: "employee@zad.org.sa · Demo@123456 (بعد seed:excel) — مع متطلبات مسندة لإدارته",
    goldenRule: "رؤية: شواهد فقط · وصول: ممنوع /dept-follow و/approvals و/admin · نطاق: ما يملكه فقط",
    cases: [
      {
        id: "emp-01",
        n: 1,
        title: "الشريط الجانبي يعرض شواهد المؤشرات فقط",
        dimensions: ["رؤية"],
        steps: ["سجّل دخول كموظف", "افحص عناصر التنقّل"],
        expected: "يظهر «شواهد المؤشرات» فقط — لا مراجعة إدارة ولا اعتماد نهائي ولا إدارة نظام",
      },
      {
        id: "emp-02",
        n: 2,
        title: "يرى مؤشراته المسندة فقط",
        dimensions: ["نطاق"],
        steps: ["افتح /my", "قارن القائمة بما أُسند له في إسناد المسؤولين"],
        expected: "لا تظهر متطلبات بلا ownerId له ولا متطلبات إدارة أخرى",
      },
      {
        id: "emp-03",
        n: 3,
        title: "يمنع الوصول لمسارات الإدارة",
        dimensions: ["وصول"],
        steps: ["جرّب فتح /dept-follow و/approvals و/admin/users مباشرة"],
        expected: "إعادة توجيه أو منع — لا محتوى إداري",
      },
      {
        id: "emp-04",
        n: 4,
        title: "إدخال مسودة وحفظها",
        dimensions: ["نطاق"],
        steps: ["في /my أدخل متحققًا واحفظ مسودة"],
        expected: "الحالة DRAFT · لا يظهر القياس في لوحات التحليل",
      },
      {
        id: "emp-05",
        n: 5,
        title: "رفع شاهد في المسودة",
        dimensions: ["نطاق"],
        steps: ["ارفع شاهدًا وهو DRAFT"],
        expected: "يُقبل الرفع · العدّ يعكس الشواهد النشطة فقط",
      },
      {
        id: "emp-06",
        n: 6,
        title: "التقديم يُقفل الإدخال",
        dimensions: ["نطاق"],
        steps: ["قدّم للمراجعة", "حاول تعديل القيمة أو رفع شاهد"],
        expected: "الحالة SUBMITTED · الحقول مقفلة · رسالة منع عند محاولة الكتابة عبر API/واجهة",
      },
      {
        id: "emp-07",
        n: 7,
        title: "منع حذف الشاهد بعد التقديم",
        dimensions: ["نطاق"],
        steps: ["بعد SUBMITTED حاول حذف شاهد (إن وُجد زر أو عبر API)"],
        expected: "رفض 400 — الحذف فقط في DRAFT أو بعد الرفض",
      },
      {
        id: "emp-08",
        n: 8,
        title: "حلقة الرفض — ظهور ملاحظات القسم",
        dimensions: ["نطاق"],
        steps: [
          "اطلب من المدير إرجاع القياس بملاحظات",
          "أعد الدخول كموظف وافتح /my",
        ],
        expected: "حالة قابلة للتعديل · صندوق «ملاحظات القسم / المشرف» يظهر السبب والحقول/الشواهد المرفوضة",
      },
      {
        id: "emp-09",
        n: 9,
        title: "إعادة التقديم بعد REJECTED_EVIDENCE",
        dimensions: ["نطاق"],
        steps: [
          "بعد رفض شواهد من المشرف: ارفع شاهدًا بديلًا",
          "اضغط «إعادة التقديم»",
        ],
        expected: "الرفع وحده لا يكفي · إعادة التقديم تعيد SUBMITTED (أو المسار الصحيح) · تنبيه واضح في الواجهة",
      },
      {
        id: "emp-10",
        n: 10,
        title: "لا انعكاس في اللوحات قبل الاعتماد النهائي",
        dimensions: ["نطاق"],
        steps: ["بعد التقديم (قبل النهائي) افتح /strategic بحساب إداري وقارن قيمة المؤشر"],
        expected: "لا صف KpiEntry تحليلي للقياس غير النهائي — القيمة لا تظهر كمعتمدة",
      },
      {
        id: "emp-11",
        n: 11,
        title: "التقديم بلا شاهد نشط يُرفض",
        dimensions: ["نطاق"],
        steps: [
          "احفظ مسودة بلا شواهد",
          "حاول التقديم من الواجهة ثم عبر API إن أمكن",
        ],
        expected: "زر التقديم معطّل · رسالة واضحة · API 400 «يجب رفع شاهد…»",
      },
      {
        id: "emp-12",
        n: 12,
        title: "جولة مغلقة تمنع التقديم وتسمح بالمسودة",
        dimensions: ["نطاق"],
        steps: [
          "كمشرف أغلق الجولة من /admin/settings",
          "كموظف احفظ مسودة ثم حاول التقديم",
        ],
        expected: "المسودة تنجح · التقديم يُرفض برسالة «جولة القياس مغلقة»",
      },
    ],
  },
  {
    id: "section-head",
    title: "2) رئيس القسم",
    roleLabel: "SECTION_HEAD",
    demoHint: "head@zad.org.sa — قسم مربوط · تحقق إعدادات التفويض في /admin/settings",
    goldenRule: "رؤية: شواهد فقط (كالموظف) · وصول: لا اعتماد نهائي · نطاق: قسمه عند الإسناد",
    cases: [
      {
        id: "sh-01",
        n: 1,
        title: "الشريط الجانبي كالموظف",
        dimensions: ["رؤية"],
        steps: ["دخول كرئيس قسم", "افحص التنقّل"],
        expected: "شواهد المؤشرات فقط — لا /dept-follow ولا /approvals",
      },
      {
        id: "sh-02",
        n: 2,
        title: "نطاق الإسناد = قسمه",
        dimensions: ["نطاق"],
        steps: ["كمشرف/مدير أسند متطلبات بقسم محدّد لرئيس القسم", "ادخل كرئيس وافتح /my"],
        expected: "يرى فقط ما طابق sectionId · لا متطلبات أقسام أخرى",
      },
      {
        id: "sh-03",
        n: 3,
        title: "التفويض مطفأ — لا يظهر في مسار الاعتماد النهائي",
        dimensions: ["وصول"],
        steps: ["تأكد أن تفويض رئيس القسم للاعتماد مطفأ في الإعدادات", "جرّب /approvals"],
        expected: "ممنوع — الاعتماد النهائي لمشرف النظام فقط في التصميم الحالي",
      },
      {
        id: "sh-04",
        n: 4,
        title: "لا اعتماد ذاتي لمؤشراته",
        dimensions: ["وصول", "نطاق"],
        steps: ["قدّم قياسًا كرئيس قسم", "حاول فتح مراجعة الإدارة إن وُجدت صلاحية قديمة"],
        expected: "لا يستطيع اعتماد ما يملكه/أدخله مبدئيًا — المسار يمر لمدير الإدارة",
      },
      {
        id: "sh-05",
        n: 5,
        title: "قفل بعد التقديم كالموظف",
        dimensions: ["نطاق"],
        steps: ["قدّم ثم حاول التعديل"],
        expected: "مقفل حتى الإرجاع/الرفض",
      },
    ],
  },
  {
    id: "dept-manager",
    title: "3) مدير الإدارة",
    roleLabel: "DEPT_MANAGER",
    demoHint: "manager@zad.org.sa — إدارة مربوطة · موظفون في نفس الإدارة للاختبار",
    goldenRule: "رؤية: شواهد + مراجعة + إسناد · وصول: لا اعتماد نهائي · نطاق: إدارته فقط",
    cases: [
      {
        id: "dm-01",
        n: 1,
        title: "الشريط: شواهد + مراجعة الإدارة + إسناد المسؤولين",
        dimensions: ["رؤية"],
        steps: ["دخول كمدير", "افحص التنقّل"],
        expected: "ثلاثة بنود رئيسية · لا /approvals ولا إدارة مستخدمين عامة",
      },
      {
        id: "dm-02",
        n: 2,
        title: "الاعتماد المبدئي لما قدّمه الموظف/الرئيس",
        dimensions: ["نطاق"],
        steps: ["موظف يقدّم", "المدير يفتح /dept-follow ويعتمد مبدئيًا"],
        expected: "ينتقل إلى INITIAL_APPROVED · يظهر عند المشرف في /approvals",
      },
      {
        id: "dm-03",
        n: 3,
        title: "منع الاعتماد الذاتي",
        dimensions: ["وصول"],
        steps: ["المدير يقدّم قياسًا يملكه", "يحاول الاعتماد المبدئي لنفسه من /dept-follow"],
        expected: "رفض صريح — تقديم المدير يتجاوز الطبقة إلى النهائي مباشرة",
      },
      {
        id: "dm-04",
        n: 4,
        title: "تجاوز طبقته عند إدخاله",
        dimensions: ["نطاق"],
        steps: ["قدّم كمدير من /my"],
        expected: "الحالة INITIAL_APPROVED مباشرة · إشعار للمشرف · لا ينتظر اعتمادًا مبدئيًا من نفسه",
      },
      {
        id: "dm-05",
        n: 5,
        title: "إسناد المسؤولين ضمن الإدارة فقط",
        dimensions: ["رؤية", "نطاق"],
        steps: ["افتح /admin/assign", "جرّب فلتر الإدارات"],
        expected: "نطاق إدارته مثبت · قائمة منسدلة لكل متطلب (اسم — دور) · مرشح واحد يُسند تلقائيًا",
      },
      {
        id: "dm-06",
        n: 6,
        title: "تطابق الدور عند الإسناد",
        dimensions: ["نطاق"],
        steps: ["أسند متطلبًا لموظف ثم غيّره لرئيس قسم في نفس النطاق"],
        expected: "fillerRole يتبع دور المختار · الإسناد خارج الإدارة مرفوض",
      },
      {
        id: "dm-07",
        n: 7,
        title: "إرجاع بملاحظات ظاهرة",
        dimensions: ["نطاق"],
        steps: ["أرجع قياسًا بملاحظات من نافذة المراجعة"],
        expected: "DRAFT للموظف · ملاحظات القسم ظاهرة في البطاقة و/my",
      },
      {
        id: "dm-08",
        n: 8,
        title: "منع الوصول للاعتماد النهائي وإدارة المستخدمين",
        dimensions: ["وصول"],
        steps: ["افتح /approvals و/admin/users"],
        expected: "ممنوع / إعادة توجيه",
      },
    ],
  },
  {
    id: "executive",
    title: "4) الإدارة العليا",
    roleLabel: "EXECUTIVE",
    demoHint: "executive@zad.org.sa",
    goldenRule: "رؤية: لوحة تنفيذية + مسارات · وصول: ممنوع الإدخال/الاعتماد/الإدارة · نطاق: كل الجمعية · بيانات نهائية فقط",
    cases: [
      {
        id: "ex-01",
        n: 1,
        title: "الشريط: لوحة عليا + مسارات بدون إدخال",
        dimensions: ["رؤية"],
        steps: ["دخول كتنفيذي", "افحص التنقّل"],
        expected: "executive + dashboard + مسارات القياس — لا /my تعبئة ولا /dept-follow ولا /approvals ولا /admin",
      },
      {
        id: "ex-02",
        n: 2,
        title: "اطلاع على كل الجمعية",
        dimensions: ["نطاق"],
        steps: ["افتح /executive و/strategic"],
        expected: "بيانات عبر الإدارات (لا فلتر إدارة المستخدم)",
      },
      {
        id: "ex-03",
        n: 3,
        title: "بيانات نهائية فقط في التحليل",
        dimensions: ["نطاق"],
        steps: ["قارن مؤشرًا SUBMITTED غير نهائي مع لوحة التنفيذي"],
        expected: "لا يظهر كمعتمد حتى FINAL_APPROVED",
      },
      {
        id: "ex-04",
        n: 4,
        title: "ممنوع من مسارات الإدارة والتعبئة",
        dimensions: ["وصول"],
        steps: ["جرّب /my و/admin/assign و/approvals"],
        expected: "منع أو عدم ظهور في التنقّل مع رفض الوصول",
      },
    ],
  },
  {
    id: "system-admin",
    title: "5) مشرف النظام",
    roleLabel: "SYSTEM_ADMIN",
    demoHint: "admin@zad.org.sa · ADMIN_PASSWORD من .env",
    goldenRule: "رؤية: الكل + اعتماد نهائي + إسناد · وصول: النهائي فقط للطبقات · نطاق: كل الإدارات",
    cases: [
      {
        id: "sa-01",
        n: 1,
        title: "الشريط يشمل الاعتماد النهائي وإدارة النظام",
        dimensions: ["رؤية"],
        steps: ["دخول كمشرف", "افحص التنقّل"],
        expected: "approvals + admin/* + مسارات + executive — بدون /dept-follow (يُحوَّل للاعتماد النهائي)",
      },
      {
        id: "sa-02",
        n: 2,
        title: "الاعتماد النهائي ينعكس على KpiEntry/اللوحات",
        dimensions: ["نطاق"],
        steps: ["اعتمد نهائيًا قياسًا INITIAL_APPROVED", "افتح /strategic أو /dashboard"],
        expected: "يظهر الصف التحليلي بعد النهائي فقط",
      },
      {
        id: "sa-03",
        n: 3,
        title: "إلغاء النهائي يُزيل الإسقاط التحليلي",
        dimensions: ["نطاق"],
        steps: [
          "من تبويب المعتمد نهائيًا: اختر وجهة الإلغاء ثم ألغِ بسبب",
          "أعد فحص اللوحة",
        ],
        expected: "يختفي من التحليل · DRAFT أو SUBMITTED حسب الخيار · ملاحظات ظاهرة للمدير/المالك",
      },
      {
        id: "sa-04",
        n: 4,
        title: "حراسة القفل — تعارض الحالة 409",
        dimensions: ["وصول"],
        steps: ["افتح نفس القياس في نافذتين", "اعتمد من الأولى ثم حاول من الثانية"],
        expected: "رسالة «تغيّرت حالة القياس، أعِد التحميل» (409)",
      },
      {
        id: "sa-05",
        n: 5,
        title: "الرفض لا يسجّل الرافض كمعتمِد",
        dimensions: ["نطاق"],
        steps: ["أرجع للتعديل من /approvals", "افحص approvedById في قاعدة البيانات أو العرض"],
        expected: "approvedById و approvedAt فارغان بعد الرفض",
      },
      {
        id: "sa-06",
        n: 6,
        title: "الاستيراد وإدارة المستخدمين/المؤشرات",
        dimensions: ["رؤية", "وصول"],
        steps: ["افتح /admin/import و/admin/users و/admin/kpis"],
        expected: "متاحة للمشرف فقط · العمليات تُسجَّل في audit عند التطبيق",
      },
      {
        id: "sa-07",
        n: 7,
        title: "إسناد كل الإدارات",
        dimensions: ["نطاق"],
        steps: ["افتح إسناد المسؤولين وغيّر فلتر الإدارات"],
        expected: "يرى كل الإدارات بخلاف المدير المقيد بإدارته",
      },
      {
        id: "sa-08",
        n: 8,
        title: "إلغاء نهائي → مسودة للموظف (owner_draft)",
        dimensions: ["نطاق"],
        steps: [
          "من معتمد نهائيًا اختر «مسودة للموظف» وأكّد بسبب",
          "افحص /my للمالك و/dept-follow للمدير",
        ],
        expected: "الحالة DRAFT · المالك يعدّل · إشعار /my للمالك و/dept-follow للمدير",
      },
      {
        id: "sa-09",
        n: 9,
        title: "إلغاء نهائي → مراجعة المدير (dept_review)",
        dimensions: ["نطاق"],
        steps: [
          "من معتمد نهائيًا اختر «إعادة لمراجعة المدير» وأكّد بسبب",
          "افحص حساب المدير والموظف",
        ],
        expected: "الحالة SUBMITTED · الموظف مقفل · إشعار المدير بـ /dept-follow?mp=",
      },
      {
        id: "sa-10",
        n: 10,
        title: "Workbench يعرض الفجوة واقتراح الفترة السابقة",
        dimensions: ["رؤية", "نطاق"],
        steps: [
          "افتح قياسًا بانتظار الاعتماد النهائي بفجوة ≠ 0",
          "جرّب «تطبيق اقتراح الفترة السابقة» و«فتح مؤشر الفترة السابقة»",
        ],
        expected: "مستهدف/متحقق/فجوة ظاهرة · الاقتراح يملأ المتحقق بموافقة المشرف فقط · الرابط يفتح التحليل",
      },
      {
        id: "sa-11",
        n: 11,
        title: "تبويب متابعة الإغلاق + تذكير",
        dimensions: ["رؤية", "نطاق"],
        steps: [
          "افتح تبويب متابعة الإغلاق في /approvals",
          "أرسل تذكيرًا لإدارة فيها متبقٍ",
        ],
        expected: "أعمدة: إجمالي/متحقق نهائي/متبقي/جزئي · إشعار+بريد للمالك برابط /my?mp=",
      },
      {
        id: "sa-12",
        n: 12,
        title: "تقرير العرض وجولة القياس",
        dimensions: ["رؤية", "وصول"],
        steps: [
          "اضبط سنة/فترة الجولة من الإعدادات",
          "افتح /admin/report",
        ],
        expected: "التقرير يعرض FINAL_APPROVED للجولة فقط · الشرائح/الطباعة تعمل · الرابط للمشرف فقط",
      },
      {
        id: "sa-13",
        n: 13,
        title: "فلاتر إدارة المؤشرات (إدارة/مسؤول)",
        dimensions: ["رؤية"],
        steps: ["افتح /admin/kpis", "طبّق فلتر إدارة ثم مسؤول"],
        expected: "القائمة تُضيَّق حسب الفلترين · المسؤولون يتبعون الإدارة المختارة",
      },
    ],
  },
  {
    id: "e2e-chain",
    title: "6) سلسلة الاعتماد عبر الأدوار (الأهم)",
    roleLabel: "E2E",
    demoHint: "جهّز موظف + مدير + مشرف على نفس متطلب/إدارة · سجّل قيمًا واضحة للتتبّع",
    goldenRule: "لا قيمة تحليلية قبل النهائي · تظهر بعد final_approve · تختفي بعد revoke_final",
    cases: [
      {
        id: "e2e-01",
        n: 1,
        title: "إسناد → إدخال → لا انعكاس",
        dimensions: ["نطاق"],
        steps: [
          "المدير/المشرف يسند المتطلب للموظف",
          "الموظف يحفظ مسودة بقيمة مميزة (مثلاً 77)",
          "افحص اللوحات كتنفيذي/مشرف",
        ],
        expected: "لا يظهر 77 في التحليل · لا صف KpiEntry غير نهائي",
      },
      {
        id: "e2e-02",
        n: 2,
        title: "تقديم → اعتماد مبدئي → لا انعكاس بعد",
        dimensions: ["نطاق"],
        steps: [
          "الموظف يقدّم",
          "المدير يعتمد مبدئيًا من /dept-follow",
          "أعد فحص /strategic",
        ],
        expected: "ما زال غير ظاهر تحليليًا · الحالة INITIAL_APPROVED في /approvals فقط",
      },
      {
        id: "e2e-03",
        n: 3,
        title: "اعتماد نهائي → انعكاس فوري",
        dimensions: ["نطاق"],
        steps: ["المشرف يعتمد نهائيًا", "افتح المسار الاستراتيجي/التشغيلي/اللوحة"],
        expected: "القيمة 77 تظهر ضمن FINAL_APPROVED فقط",
      },
      {
        id: "e2e-04",
        n: 4,
        title: "إلغاء نهائي → اختفاء من التحليل حسب وجهة الإلغاء",
        dimensions: ["نطاق"],
        steps: [
          "المشرف يلغي الاعتماد النهائي ويختار owner_draft أو dept_review",
          "افحص اللوحات",
          "افحص /dept-follow للمدير و/my للمالك",
        ],
        expected: "يختفي من التحليل · DRAFT للمالك أو SUBMITTED للمدير حسب الخيار",
      },
      {
        id: "e2e-05",
        n: 5,
        title: "مسار تقديم المدير (تجاوز الطبقة 2)",
        dimensions: ["نطاق"],
        steps: ["مدير يقدّم من /my", "مشرف يعتمد نهائيًا مباشرة"],
        expected: "لا مرور بمراجعة إدارة ذاتية · انعكاس فقط بعد النهائي",
      },
      {
        id: "e2e-06",
        n: 6,
        title: "شاهد إلزامي قبل التقديم في السلسلة",
        dimensions: ["نطاق"],
        steps: [
          "موظف يحاول التقديم بلا شاهد",
          "يرفع شاهدًا ثم يقدّم",
          "أكمل الاعتماد المبدئي ثم النهائي",
        ],
        expected: "الرفض بلا شاهد · النجاح مع شاهد · انعكاس بعد النهائي فقط",
      },
    ],
  },
  {
    id: "notifications",
    title: "7) الإشعارات عبر الأدوار",
    roleLabel: "NOTIFY",
    demoHint: "فعّل SMTP إن أمكن · راقب جرس الإشعارات لكل حساب",
    goldenRule: "المالك → /my?mp= · المدير → /dept-follow عند الحاجة · لا إشعار /my لغير المالك",
    cases: [
      {
        id: "nt-01",
        n: 1,
        title: "عند تقديم الموظف",
        dimensions: ["نطاق"],
        steps: ["موظف يقدّم", "افتح حساب مدير الإدارة"],
        expected: "إشعار طلب مراجعة · الرابط يقود لمراجعة الإدارة",
      },
      {
        id: "nt-02",
        n: 2,
        title: "عند تقديم المدير (تجاوز)",
        dimensions: ["نطاق"],
        steps: ["مدير يقدّم", "افتح حساب مشرف"],
        expected: "إشعار بانتظار الاعتماد النهائي · رابط /approvals",
      },
      {
        id: "nt-03",
        n: 3,
        title: "عند إرجاع الإدارة",
        dimensions: ["نطاق"],
        steps: ["مدير يُرجع", "افتح حساب المالك"],
        expected: "إشعار للمالك برابط /my?mp= · لا يُشعر غير المالك بـ /my",
      },
      {
        id: "nt-04",
        n: 4,
        title: "عند الاعتماد النهائي",
        dimensions: ["نطاق"],
        steps: ["مشرف يعتمد نهائيًا", "افتح حساب المالك"],
        expected: "إشعار نتيجة اعتماد · رابط /my",
      },
      {
        id: "nt-05",
        n: 5,
        title: "عند إلغاء النهائي",
        dimensions: ["نطاق"],
        steps: ["مشرف يلغي مع اختيار الوجهة", "افحص المالك والمدير"],
        expected: "owner_draft → مالك /my + مدير /dept-follow · dept_review → مدير /dept-follow (المالك لا يُشعَر بـ /my)",
      },
      {
        id: "nt-06",
        n: 6,
        title: "دخول عبر callbackUrl من رابط الإشعار",
        dimensions: ["نطاق"],
        steps: [
          "من جلسة مسجّلة اخرج",
          "افتح رابط الإشعار /login?callbackUrl=/my?mp=…",
          "سجّل الدخول",
        ],
        expected: "بعد الدخول يُفتح المسار الآمن مع ?mp= · لا قبول لروابط خارجية",
      },
      {
        id: "nt-07",
        n: 7,
        title: "تذكير متابعة الإغلاق",
        dimensions: ["نطاق"],
        steps: ["مشرف من تبويب متابعة الإغلاق يضغط تذكير لإدارة", "افتح حساب المالك"],
        expected: "إشعار منصة + بريد · الرابط /my?mp= للمتطلب المتبقي",
      },
    ],
  },
];

export const UAT_ALL_ROLE_CASES = UAT_ROLE_SECTIONS.flatMap((s) => s.cases);

export type UatRolesState = {
  verdicts: Record<string, UatRoleVerdict>;
  notes: Record<string, string>;
};

export function defaultUatRolesState(): UatRolesState {
  const verdicts: Record<string, UatRoleVerdict> = {};
  for (const c of UAT_ALL_ROLE_CASES) verdicts[c.id] = "غير مجرّب";
  return { verdicts, notes: {} };
}

/** تقرير Markdown — زمن O(n) · مساحة O(n) */
export function buildUatRolesReport(state: UatRolesState): string {
  const counts = {
    total: 0,
    "غير مجرّب": 0,
    مطابق: 0,
    "يحتاج تحسين": 0,
    خلل: 0,
  };
  for (const c of UAT_ALL_ROLE_CASES) {
    const v = state.verdicts[c.id] ?? "غير مجرّب";
    counts[v] += 1;
    counts.total += 1;
  }

  const now = new Date().toLocaleString("ar-SA", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const lines: string[] = [
    "# تقرير تقييم الأدوار والصلاحيات — مِقياس | جمعية الزاد",
    "",
    `تاريخ التقرير: ${now}`,
    "",
    "> مكمّل لقائمة الأدوات (`uat-tools-checklist`). القاعدة الذهبية: رؤية + وصول + نطاق.",
    "",
    "## الملخص",
    "",
    `| الإجمالي | مطابق | يحتاج تحسين | خلل | غير مجرّب |`,
    `|----------|--------|-------------|-----|-----------|`,
    `| ${counts.total} | ${counts["مطابق"]} | ${counts["يحتاج تحسين"]} | ${counts["خلل"]} | ${counts["غير مجرّب"]} |`,
    "",
  ];

  for (const section of UAT_ROLE_SECTIONS) {
    lines.push(`## ${section.title}`, "");
    lines.push(`- الدور: \`${section.roleLabel}\``);
    lines.push(`- حساب مقترح: ${section.demoHint}`);
    lines.push(`- القاعدة الذهبية: ${section.goldenRule}`);
    lines.push("");
    for (const c of section.cases) {
      const v = state.verdicts[c.id] ?? "غير مجرّب";
      const note = state.notes[c.id]?.trim() || "—";
      lines.push(`### ${c.n}. ${c.title}`);
      lines.push(`- الأبعاد: ${c.dimensions.join(" · ")}`);
      lines.push(`- التقييم: **${v}**`);
      lines.push(`- ملاحظة: ${note}`);
      lines.push(`- الخطوات:`);
      for (const s of c.steps) lines.push(`  1. ${s}`);
      lines.push(`- المتوقع: ${c.expected}`);
      lines.push("");
    }
  }

  lines.push("## طريقة الإرجاع للمطور", "");
  lines.push(
    "كل حالة تقييمها **خلل** أو **يحتاج تحسين** تُنسخ هنا كملاحظة مستقلة لإحالتها كأمر إصلاح."
  );
  lines.push("");

  return lines.join("\n");
}
