/**
 * سجل مراحل الأدوات — مرجع التجربة والتوسعة.
 * أي إضافة جديدة يجب تسجيلها هنا ووسمها في التنقّل.
 */

export type PhaseId = "core" | "m1" | "m2" | "m3" | "uat";

export const PHASE_LABEL: Record<PhaseId, string> = {
  core: "أصل",
  m1: "م1",
  m2: "م2",
  m3: "م3",
  uat: "تجربة",
};

export const PHASE_TITLE: Record<PhaseId, string> = {
  core: "أصل القياس",
  m1: "المرحلة 1 — مكتب الاستراتيجية",
  m2: "المرحلة 2 — المراجعة الداخلية",
  m3: "المرحلة 3 — لجنة المراجعة",
  uat: "بيئة التجربة",
};

export type ToolPhaseMeta = {
  phase: PhaseId;
  /** اسم الأداة */
  name: string;
  /** بماذا ترتبط / أين تُدمَج */
  integratesWith: string;
  /** جملة واحدة: كيف تعمل الأداة */
  howTo: string;
};

/** مسارات الأدوات المعروضة للمستخدم — أطول بادئة تفوز */
export const TOOLS: { prefix: string; meta: ToolPhaseMeta }[] = [
  {
    prefix: "/my",
    meta: {
      phase: "core",
      name: "شواهد المؤشرات",
      integratesWith: "طبقة الإدخال الموحّدة لجميع المجالات",
      howTo: "يُدخل المالك قياس الفترة ويرفع الشاهد ثم يقدّمه للاعتماد.",
    },
  },
  {
    prefix: "/dept-follow",
    meta: {
      phase: "core",
      name: "مراجعة الإدارة",
      integratesWith: "الاعتماد المبدئي على شواهد /my",
      howTo: "يعتمد مدير الإدارة مبدئياً ما قدّمه الموظف أو رئيس القسم.",
    },
  },
  {
    prefix: "/approvals",
    meta: {
      phase: "core",
      name: "الاعتماد النهائي",
      integratesWith: "إغلاق دورة القياس بعد المراجعة",
      howTo: "يغلق مشرف النظام دورة القياس بعد الاعتماد المبدئي.",
    },
  },
  {
    prefix: "/dashboard",
    meta: {
      phase: "core",
      name: "اللوحة الرئيسية",
      integratesWith: "ملخص مسارات القياس",
      howTo: "تعرض ملخص حالات المؤشرات والانحراف للفترة المختارة.",
    },
  },
  {
    prefix: "/executive",
    meta: {
      phase: "core",
      name: "لوحة الإدارة التنفيذية",
      integratesWith: "قراءة مجمّعة لمسارات القياس",
      howTo: "تلخّص القيم المعتمدة نهائياً والمخاطر على مستوى الجمعية.",
    },
  },
  {
    prefix: "/strategic",
    meta: {
      phase: "core",
      name: "المسار الاستراتيجي",
      integratesWith: "مؤشرات feedsStrategic من إدارة المؤشرات",
      howTo: "يعرض المؤشرات الموسومة استراتيجياً وقيمها المعتمدة نهائياً.",
    },
  },
  {
    prefix: "/operational",
    meta: {
      phase: "core",
      name: "المسار التشغيلي",
      integratesWith: "مؤشرات type=OPERATIONAL",
      howTo: "يتابع الأهداف والمؤشرات التشغيلية ومقارنة المتحقق بالمستهدف.",
    },
  },
  {
    prefix: "/early-warning",
    meta: {
      phase: "core",
      name: "الإنذار المبكر",
      integratesWith: "انحرافات مؤشرات القياس",
      howTo: "ينبّه عند اتساع الفجوة بين المتحقق والمستهدف قبل نهاية الفترة.",
    },
  },
  {
    prefix: "/deviation",
    meta: {
      phase: "core",
      name: "بطاقات الانحراف",
      integratesWith: "متابعة فجوات المؤشرات",
      howTo: "تسجّل سبب انحراف المؤشر وإجراءاته التصحيحية حتى الإغلاق.",
    },
  },
  {
    prefix: "/governance",
    meta: {
      phase: "core",
      name: "الحوكمة",
      integratesWith: "سجلات الحوكمة + ربط متطلب القياس (م1)",
      howTo: "تعرض متطلبات الحوكمة ونسبة الالتزام، والشاهد يُكتب من إدارة المؤشرات.",
    },
  },
  {
    prefix: "/knowledge",
    meta: {
      phase: "core",
      name: "المعرفة المؤسسية",
      integratesWith: "أصول مرتبطة بمؤشرات القياس",
      howTo: "تسجّل أصول المعرفة وربطها بمؤشر أو إدارة دون استبدال الشاهد.",
    },
  },
  {
    prefix: "/admin/kpis",
    meta: {
      phase: "core",
      name: "إدارة المؤشرات",
      integratesWith: "مصدر الكتابة الموحّد؛ أوسمة م1 مدموجة هنا",
      howTo: "تُنشأ المؤشرات والمتطلبات هنا، بما فيها وسم الاستراتيجي والحوكمة.",
    },
  },
  {
    prefix: "/admin/assign",
    meta: {
      phase: "core",
      name: "إسناد المسؤولين",
      integratesWith: "مالك واحد لمتطلب القياس يظهر في /my",
      howTo: "يُسنَد مالك واحد للمتطلب فيظهر له في شواهد المؤشرات.",
    },
  },
  {
    prefix: "/admin/users",
    meta: {
      phase: "core",
      name: "إدارة المستخدمين",
      integratesWith: "حسابات وأدوار المنصة",
      howTo: "ينشئ المشرف الحسابات ويعيّن الدور، ومنه مراجع داخلي وعضو لجنة.",
    },
  },
  {
    prefix: "/admin/settings",
    meta: {
      phase: "core",
      name: "إعدادات النظام",
      integratesWith: "جولة القياس والتنبيهات",
      howTo: "تضبط جولة القياس والعتبات وإشعارات المنصة.",
    },
  },
  {
    prefix: "/admin/report",
    meta: {
      phase: "core",
      name: "منشئ العرض التقديمي",
      integratesWith: "تقارير من بيانات القياس المعتمدة",
      howTo: "يبني عرضاً من بيانات القياس المعتمدة دون مسار كتابة موازٍ.",
    },
  },
  {
    prefix: "/admin/import",
    meta: {
      phase: "core",
      name: "استيراد Excel",
      integratesWith: "تغذية إدارة المؤشرات",
      howTo: "يستورد تعريفات المؤشرات إلى إدارة المؤشرات من ملف Excel.",
    },
  },
  {
    prefix: "/strategy",
    meta: {
      phase: "m1",
      name: "كتالوج الاستراتيجية والحوكمة",
      integratesWith: "عرض فقط لـ /admin/kpis (لا نموذج موازٍ)",
      howTo: "يعرض المؤشرات الاستراتيجية والحوكمة فقط، والتعديل من إدارة المؤشرات.",
    },
  },
  {
    prefix: "/calendar",
    meta: {
      phase: "m1",
      name: "رزنامة القسم",
      integratesWith: "مكتب الاستراتيجية فوق أصل القياس",
      howTo: "تسجّل مواعيد القسم ويعدّلها مكتب الاستراتيجية.",
    },
  },
  {
    prefix: "/audit/plan",
    meta: {
      phase: "m2",
      name: "الخطة السنوية للمراجعة",
      integratesWith: "وحدة المراجعة الداخلية تحت /audit",
      howTo: "تُنشأ خطة السنة ثم تُربط بها مهام المراجعة.",
    },
  },
  {
    prefix: "/audit/engagements",
    meta: {
      phase: "m2",
      name: "مهام وبرامج المراجعة",
      integratesWith: "الخطة السنوية للمراجعة",
      howTo: "كل مهمة تتبع خطة سنوية وإدارة خاضعة للمراجعة.",
    },
  },
  {
    prefix: "/audit/findings",
    meta: {
      phase: "m2",
      name: "الملاحظات والمخاطر",
      integratesWith: "مهام المراجعة والإجراءات التصحيحية",
      howTo: "تُسجَّل الملاحظة على مهمة، ثم إجراءاتها، وتُغلق بعد إنجازها.",
    },
  },
  {
    prefix: "/audit/papers",
    meta: {
      phase: "m2",
      name: "أوراق العمل",
      integratesWith: "سرية INTERNAL_ONLY — فريق المراجعة فقط",
      howTo: "ملفات سرية لفريق المراجعة فقط، ولا تظهر للجنة.",
    },
  },
  {
    prefix: "/audit/reports",
    meta: {
      phase: "m2",
      name: "تقارير المراجعة الصادرة",
      integratesWith: "عرض بدون كشف أوراق العمل",
      howTo: "يُكتب التقرير ثم يُصدر، فتراها اللجنة دون أوراق العمل.",
    },
  },
  {
    prefix: "/audit",
    meta: {
      phase: "m2",
      name: "ملخص المراجعة الداخلية",
      integratesWith: "مؤشرات إغلاق وملاحظات مفتوحة فوق أصل القياس",
      howTo: "أرقام الإغلاق والملاحظات المفتوحة محسوبة من خطة المراجعة وملاحظاتها.",
    },
  },
  {
    prefix: "/committee/meetings",
    meta: {
      phase: "m3",
      name: "اجتماعات لجنة المراجعة",
      integratesWith: "جدول اللجنة فوق تقارير المراجعة الصادرة",
      howTo: "يُجدول الاجتماع وتُكتب أجندته، ثم يُعلَّم عند انعقاده.",
    },
  },
  {
    prefix: "/committee/minutes",
    meta: {
      phase: "m3",
      name: "محاضر اللجنة",
      integratesWith: "اجتماعات اللجنة — بلا أوراق عمل المراجعة",
      howTo: "يكتبها عضو اللجنة على اجتماع قائم، ويقرأها فريق المراجعة دون تعديل.",
    },
  },
  {
    prefix: "/committee/decisions",
    meta: {
      phase: "m3",
      name: "قرارات وتوصيات اللجنة",
      integratesWith: "متابعة تنفيذ توصيات اللجنة",
      howTo: "تُضاف التوصية ثم تُتابَع حتى تُعلَّم منفذة.",
    },
  },
  {
    prefix: "/committee/inbox",
    meta: {
      phase: "m3",
      name: "تقارير ورفع المراجع الخارجي",
      integratesWith: "تقارير م2 الصادرة + ملفات يرفعها مستخدم داخلي",
      howTo: "تعرض التقارير الصادرة، ويُرفع ملف المراجع الخارجي من حساب داخلي.",
    },
  },
  {
    prefix: "/committee",
    meta: {
      phase: "m3",
      name: "لوحة لجنة المراجعة",
      integratesWith: "ملخص ملاحظات وتقارير وقرارات دون كشف أوراق العمل",
      howTo: "ملخص مفتوح ومغلق وعالي الخطورة وتوصيات، دون أوراق العمل.",
    },
  },
  {
    prefix: "/uat",
    meta: {
      phase: "uat",
      name: "تقييم الأدوات",
      integratesWith: "بيئة تجربة دون استبدال الإنتاج",
      howTo: "قائمة تجربة للأدوار والأدوات، ولا تستبدل بيانات الإنتاج.",
    },
  },
];

/** أطول بادئة مطابقة — O(P) حيث P عدد المسجّلات */
export function resolveToolPhase(pathname: string): ToolPhaseMeta | null {
  let best: { len: number; meta: ToolPhaseMeta } | null = null;
  for (const t of TOOLS) {
    if (pathname === t.prefix || pathname.startsWith(`${t.prefix}/`)) {
      if (!best || t.prefix.length > best.len) {
        best = { len: t.prefix.length, meta: t.meta };
      }
    }
  }
  return best?.meta ?? null;
}

export function phaseBadgeText(phase: PhaseId): string {
  return PHASE_LABEL[phase];
}
