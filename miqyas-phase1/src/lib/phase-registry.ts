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
};

/** مسارات الأدوات المعروضة للمستخدم — أطول بادئة تفوز */
const TOOLS: { prefix: string; meta: ToolPhaseMeta }[] = [
  {
    prefix: "/my",
    meta: {
      phase: "core",
      name: "شواهد المؤشرات",
      integratesWith: "طبقة الإدخال الموحّدة لجميع المجالات",
    },
  },
  {
    prefix: "/dept-follow",
    meta: {
      phase: "core",
      name: "مراجعة الإدارة",
      integratesWith: "الاعتماد المبدئي على شواهد /my",
    },
  },
  {
    prefix: "/approvals",
    meta: {
      phase: "core",
      name: "الاعتماد النهائي",
      integratesWith: "إغلاق دورة القياس بعد المراجعة",
    },
  },
  {
    prefix: "/dashboard",
    meta: {
      phase: "core",
      name: "اللوحة الرئيسية",
      integratesWith: "ملخص مسارات القياس",
    },
  },
  {
    prefix: "/executive",
    meta: {
      phase: "core",
      name: "لوحة الإدارة التنفيذية",
      integratesWith: "قراءة مجمّعة لمسارات القياس",
    },
  },
  {
    prefix: "/strategic",
    meta: {
      phase: "core",
      name: "المسار الاستراتيجي",
      integratesWith: "مؤشرات feedsStrategic من إدارة المؤشرات",
    },
  },
  {
    prefix: "/operational",
    meta: {
      phase: "core",
      name: "المسار التشغيلي",
      integratesWith: "مؤشرات type=OPERATIONAL",
    },
  },
  {
    prefix: "/early-warning",
    meta: {
      phase: "core",
      name: "الإنذار المبكر",
      integratesWith: "انحرافات مؤشرات القياس",
    },
  },
  {
    prefix: "/deviation",
    meta: {
      phase: "core",
      name: "بطاقات الانحراف",
      integratesWith: "متابعة فجوات المؤشرات",
    },
  },
  {
    prefix: "/governance",
    meta: {
      phase: "core",
      name: "الحوكمة",
      integratesWith: "سجلات الحوكمة + ربط متطلب القياس (م1)",
    },
  },
  {
    prefix: "/knowledge",
    meta: {
      phase: "core",
      name: "المعرفة المؤسسية",
      integratesWith: "أصول مرتبطة بمؤشرات القياس",
    },
  },
  {
    prefix: "/admin/kpis",
    meta: {
      phase: "core",
      name: "إدارة المؤشرات",
      integratesWith: "مصدر الكتابة الموحّد؛ أوسمة م1 مدموجة هنا",
    },
  },
  {
    prefix: "/admin/assign",
    meta: {
      phase: "core",
      name: "إسناد المسؤولين",
      integratesWith: "مالك واحد لمتطلب القياس يظهر في /my",
    },
  },
  {
    prefix: "/admin/users",
    meta: {
      phase: "core",
      name: "إدارة المستخدمين",
      integratesWith: "حسابات وأدوار المنصة",
    },
  },
  {
    prefix: "/admin/settings",
    meta: {
      phase: "core",
      name: "إعدادات النظام",
      integratesWith: "جولة القياس والتنبيهات",
    },
  },
  {
    prefix: "/admin/report",
    meta: {
      phase: "core",
      name: "منشئ العرض التقديمي",
      integratesWith: "تقارير من بيانات القياس المعتمدة",
    },
  },
  {
    prefix: "/admin/import",
    meta: {
      phase: "core",
      name: "استيراد Excel",
      integratesWith: "تغذية إدارة المؤشرات",
    },
  },
  {
    prefix: "/strategy",
    meta: {
      phase: "m1",
      name: "كتالوج الاستراتيجية والحوكمة",
      integratesWith: "عرض فقط لـ /admin/kpis (لا نموذج موازٍ)",
    },
  },
  {
    prefix: "/calendar",
    meta: {
      phase: "m1",
      name: "رزنامة القسم",
      integratesWith: "مكتب الاستراتيجية فوق أصل القياس",
    },
  },
  {
    prefix: "/audit/plan",
    meta: {
      phase: "m2",
      name: "الخطة السنوية للمراجعة",
      integratesWith: "وحدة المراجعة الداخلية تحت /audit",
    },
  },
  {
    prefix: "/audit/engagements",
    meta: {
      phase: "m2",
      name: "مهام وبرامج المراجعة",
      integratesWith: "الخطة السنوية للمراجعة",
    },
  },
  {
    prefix: "/audit/findings",
    meta: {
      phase: "m2",
      name: "الملاحظات والمخاطر",
      integratesWith: "مهام المراجعة والإجراءات التصحيحية",
    },
  },
  {
    prefix: "/audit/papers",
    meta: {
      phase: "m2",
      name: "أوراق العمل",
      integratesWith: "سرية INTERNAL_ONLY — فريق المراجعة فقط",
    },
  },
  {
    prefix: "/audit/reports",
    meta: {
      phase: "m2",
      name: "تقارير المراجعة الصادرة",
      integratesWith: "عرض بدون كشف أوراق العمل",
    },
  },
  {
    prefix: "/audit",
    meta: {
      phase: "m2",
      name: "ملخص المراجعة الداخلية",
      integratesWith: "مؤشرات إغلاق وملاحظات مفتوحة فوق أصل القياس",
    },
  },
  {
    prefix: "/committee/meetings",
    meta: {
      phase: "m3",
      name: "اجتماعات لجنة المراجعة",
      integratesWith: "جدول اللجنة فوق تقارير المراجعة الصادرة",
    },
  },
  {
    prefix: "/committee/minutes",
    meta: {
      phase: "m3",
      name: "محاضر اللجنة",
      integratesWith: "اجتماعات اللجنة — بلا أوراق عمل المراجعة",
    },
  },
  {
    prefix: "/committee/decisions",
    meta: {
      phase: "m3",
      name: "قرارات وتوصيات اللجنة",
      integratesWith: "متابعة تنفيذ توصيات اللجنة",
    },
  },
  {
    prefix: "/committee/inbox",
    meta: {
      phase: "m3",
      name: "تقارير ورفع المراجع الخارجي",
      integratesWith: "تقارير م2 الصادرة + ملفات يرفعها مستخدم داخلي",
    },
  },
  {
    prefix: "/committee",
    meta: {
      phase: "m3",
      name: "لوحة لجنة المراجعة",
      integratesWith: "ملخص ملاحظات وتقارير وقرارات دون كشف أوراق العمل",
    },
  },
  {
    prefix: "/uat",
    meta: {
      phase: "uat",
      name: "تقييم الأدوات",
      integratesWith: "بيئة تجربة دون استبدال الإنتاج",
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
