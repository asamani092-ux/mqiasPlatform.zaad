export type UatVerdict = "غير مجرّب" | "يعتمد" | "يحتاج تحسين";

export type UatNoteCategory =
  | ""
  | "UI ناقص"
  | "بيانات/تدفق"
  | "صلاحيات"
  | "أداء/أخطاء"
  | "نص/RTL"
  | "أخرى";

export type UatTool = {
  id: string;
  tool: string;
  path: string;
  href?: string;
  checks: string[];
  permission: string;
};

export type UatToolGroup = {
  id: string;
  title: string;
  tools: UatTool[];
};

export const UAT_VERDICTS: UatVerdict[] = ["غير مجرّب", "يعتمد", "يحتاج تحسين"];

export const UAT_NOTE_CATEGORIES: UatNoteCategory[] = [
  "",
  "UI ناقص",
  "بيانات/تدفق",
  "صلاحيات",
  "أداء/أخطاء",
  "نص/RTL",
  "أخرى",
];

export const UAT_STORAGE_KEY = "miqyas.uat.checklist.v1";

export const UAT_TOOL_GROUPS: UatToolGroup[] = [
  {
    id: "auth",
    title: "الدخول والجلسة",
    tools: [
      {
        id: "login",
        tool: "تسجيل الدخول",
        path: "/login",
        href: "/login",
        checks: [
          "بيانات صحيحة → /dashboard (أو callbackUrl النسبي)",
          "بيانات خاطئة → رسالة خطأ",
          "حظر بعد محاولات فاشلة",
          "RTL واسم «مِقياس | جمعية الزاد»",
          "callbackUrl نسبي مع ?mp= → يفتح القياس بعد الدخول",
          "callbackUrl خارجي/مشبوه → سقوط إلى /dashboard",
        ],
        permission: "الجميع",
      },
      {
        id: "logout",
        tool: "تسجيل الخروج",
        path: "Sidebar → تسجيل الخروج",
        checks: [
          "إنهاء الجلسة وإعادة التوجيه لـ /login",
          "منع الوصول للمسارات المحمية بعد الخروج",
        ],
        permission: "مسجّل",
      },
    ],
  },
  {
    id: "main",
    title: "الرئيسية",
    tools: [
      {
        id: "dashboard",
        tool: "اللوحة الرئيسية",
        path: "/dashboard",
        href: "/dashboard",
        checks: [
          "بطاقات ملخص (استراتيجي/تشغيلي/…)",
          "قسم «مؤشرات الانحراف» (AT_RISK/CRITICAL معتمدة نهائيًا)",
          "مخطط الأداء التراكمي ثم Donut التوزيع",
          "الهيكل التنظيمي وتوزيع الحالات",
          "فلتر الفترة يحدّث البيانات",
          "ترحيب باسم المستخدم",
        ],
        permission: "مسجّل",
      },
      {
        id: "my",
        tool: "مهامي ومؤشراتي",
        path: "/my",
        href: "/my",
        checks: [
          "قائمة KPIs المسندة للمستخدم",
          "إدخال/تعديل قيمة فعلية للفترة",
          "رفع دليل (evidence) ثم التقديم",
          "منع التقديم بلا شاهد نشط (واجهة معطّلة + API 400)",
          "عند إغلاق الجولة: مسودة مسموحة · تقديم مرفوض برسالة واضحة",
          "حالة الاعتماد (مسودة/مقدَّم/معتمد/مرفوض)",
          "فتح القياس عبر ?mp= من الإشعار",
        ],
        permission: "مسجّل (نطاق حسب الدور)",
      },
      {
        id: "notifications",
        tool: "جرس الإشعارات",
        path: "Topbar → Bell",
        checks: [
          "جلب /api/notifications",
          "عدّاد غير المقروء",
          "فتح القائمة والروابط",
          "تحديث بعد إجراءات الاعتماد",
        ],
        permission: "مسجّل",
      },
    ],
  },
  {
    id: "executive",
    title: "لوحة الإدارة العليا",
    tools: [
      {
        id: "executive",
        tool: "لوحة الإدارة العليا",
        path: "/executive",
        href: "/executive",
        checks: [
          "Donut 5-state للفترة",
          "بطاقات ملخص تنفيذي",
          "فلتر الفترة",
          "يظهر في الشريط لـ ADMIN و EXECUTIVE فقط",
        ],
        permission: "SYSTEM_ADMIN · EXECUTIVE",
      },
    ],
  },
  {
    id: "tracks",
    title: "مسارات القياس",
    tools: [
      {
        id: "strategic",
        tool: "المسار الاستراتيجي",
        path: "/strategic",
        href: "/strategic",
        checks: [
          "فلتر 5 حالات (exceeded→pending)",
          "Bar chart بالمحاور + خط الهدف",
          "جدول KPIs مجمّع بالمحور",
          "Modal تحليل + طباعة PDF",
        ],
        permission: "مسجّل (نطاق حسب الدور)",
      },
      {
        id: "operational",
        tool: "المسار التشغيلي",
        path: "/operational",
        href: "/operational",
        checks: [
          "تجميع بالإدارات",
          "Bar chart + ملخص إداري",
          "Modal تحليل KPI + PDF",
          "فلتر الفترة",
        ],
        permission: "مسجّل (نطاق حسب الدور)",
      },
      {
        id: "early-warning",
        tool: "الإنذار المبكر",
        path: "/early-warning",
        href: "/early-warning",
        checks: [
          "Donut توزيع المخاطر",
          "جدول KPIs عالية الخطورة",
          "ألوان وشارات الحالة",
          "فلتر الفترة",
        ],
        permission: "مسجّل (نطاق حسب الدور)",
      },
      {
        id: "deviation",
        tool: "بطاقات الانحراف",
        path: "/deviation",
        href: "/deviation",
        checks: [
          "فلتر حالة البطاقة (OPEN/IN_PROGRESS/CLOSED)",
          "Donut + بطاقات تفصيلية",
          "Modal: حفظ كمسودة · إقفال البطاقة (تأكيد إن وُجد إجراء غير DONE)",
          "إجراءات داخل صفوف الجدول (إضافة/حذف) + تصدير PDF أسفل يسار",
          "تجاوب الشاشات الضيقة (أزرار متراصّة · تمرير أفقي للجدول)",
          "«توليد بطاقات» (admin) POST /api/deviation/generate",
        ],
        permission: "عرض: مسجّل · إدارة: ADMIN/DEPT_MANAGER/SECTION_HEAD",
      },
      {
        id: "governance",
        tool: "الحوكمة",
        path: "/governance",
        href: "/governance",
        checks: [
          "6 مقاييس + Donut امتثال",
          "Tab-bar (متطلبات/ملاحظات)",
          "CRUD للمتطلبات والملاحظات (canManage)",
          "فلتر الفترة",
        ],
        permission: "عرض: مسجّل · إدارة: ADMIN",
      },
      {
        id: "knowledge",
        tool: "المعرفة المؤسسية",
        path: "/knowledge",
        href: "/knowledge",
        checks: [
          "4 مقاييس + Donut",
          "Modal إضافة/تعديل مادة",
          "تصنيفات وبحث",
          "صلاحيات manageKnowledge",
        ],
        permission: "عرض: مسجّل · إدارة: ADMIN/DEPT_MANAGER/SECTION_HEAD",
      },
    ],
  },
  {
    id: "approvals",
    title: "اعتماد القياسات",
    tools: [
      {
        id: "approvals",
        tool: "الاعتماد النهائي",
        path: "/approvals",
        href: "/approvals",
        checks: [
          "ثلاثة تبويبات: بانتظار الاعتماد · معتمد نهائيًا · متابعة الإغلاق",
          "Workbench: مستهدف · متحقق · فجوة",
          "عند فجوة ≠ 0: تطبيق اقتراح الفترة السابقة + فتح مؤشر الفترة السابقة",
          "اعتماد نهائي بعد قبول كل الحقول والشواهد",
          "إلغاء نهائي → خيار مسودة للموظف (owner_draft)",
          "إلغاء نهائي → خيار إعادة لمراجعة المدير (dept_review)",
          "متابعة الإغلاق: جدول إدارات (متحقق/متبقي/جزئي) + زر تذكير بريد",
          "فتح القياس عبر ?mp= · الرابط للمشرف فقط",
        ],
        permission: "SYSTEM_ADMIN فقط",
      },
    ],
  },
  {
    id: "admin",
    title: "إدارة النظام",
    tools: [
      {
        id: "admin-users",
        tool: "إدارة المستخدمين",
        path: "/admin/users",
        href: "/admin/users",
        checks: [
          "CRUD مستخدم + دور + إدارة/قسم",
          "تفعيل/تعطيل + إعادة كلمة مرور",
          "ربط بالهيكل التنظيمي من seed",
        ],
        permission: "SYSTEM_ADMIN",
      },
      {
        id: "admin-kpis",
        tool: "إدارة المؤشرات",
        path: "/admin/kpis",
        href: "/admin/kpis",
        checks: [
          "CRUD KPI + أهداف فترية (KpiTarget)",
          "ربط بالإدارة/القسم/المالك",
          "فلتر الإدارة + فلتر المسؤول (مترابطان)",
          "نوع KPI (استراتيجي/تشغيلي)",
          "تفعيل/تعطيل",
        ],
        permission: "SYSTEM_ADMIN",
      },
      {
        id: "admin-import",
        tool: "استيراد Excel",
        path: "/admin/import",
        href: "/admin/import",
        checks: [
          "رفع ملف xlsx",
          "POST /api/import",
          "رسالة نجاح/خطأ",
          "تحديث KPIs أو entries حسب القالب",
        ],
        permission: "SYSTEM_ADMIN",
      },
      {
        id: "admin-report",
        tool: "تقرير العرض التقديمي",
        path: "/admin/report",
        href: "/admin/report",
        checks: [
          "يظهر في شريط إدارة النظام",
          "جلب /api/admin/report لبيانات FINAL_APPROVED لجولة القياس",
          "شرائح العرض (ملخص · مؤشرات · خاتمة) + طباعة/تصدير",
          "رابط النموذج الثابت docs/reports (deck HTML)",
        ],
        permission: "SYSTEM_ADMIN",
      },
      {
        id: "admin-settings",
        tool: "إعدادات النظام",
        path: "/admin/settings",
        href: "/admin/settings",
        checks: [
          "سنة/فترة جولة القياس + مفتاح «الجولة مفتوحة للتقديم»",
          "إغلاق الجولة يمنع submit ويسمح بـ draft",
          "رابط تقرير العرض من قسم الجولة",
          "بريد المرسل + إرسال تجريبي (إن وُجد SMTP)",
          "حفظ عبر /api/settings",
        ],
        permission: "SYSTEM_ADMIN",
      },
    ],
  },
];

export const UAT_OUT_OF_SCOPE = [
  {
    item: "نشر الإنتاج (VPS/PM2/Nginx)",
    note: "موثّق في DEPLOYMENT.md — خارج تجربة UAT المحلية",
  },
  {
    item: "جدولة Cron /api/cron",
    note: "خدمة بلا شاشة — يحتاج CRON_SECRET في .env",
  },
  {
    item: "إرسال البريد SMTP",
    note: "خدمة بلا شاشة — يحتاج SMTP_* في .env",
  },
  {
    item: "WhatsApp / ZATCA / Hostinger",
    note: "غير موجود في التنقل أو المسارات",
  },
];

export const UAT_ALL_TOOLS = UAT_TOOL_GROUPS.flatMap((g) => g.tools);

export type UatChecklistState = {
  verdicts: Record<string, UatVerdict>;
  notes: Record<string, { category: UatNoteCategory; text: string }>;
};

export function defaultUatState(): UatChecklistState {
  const verdicts: Record<string, UatVerdict> = {};
  for (const t of UAT_ALL_TOOLS) verdicts[t.id] = "غير مجرّب";
  return { verdicts, notes: {} };
}

/** تقرير Markdown كامل للصق — زمن O(n) · مساحة O(n) */
export function buildUatReport(state: UatChecklistState): string {
  const counts = { total: 0, "غير مجرّب": 0, يعتمد: 0, "يحتاج تحسين": 0 };
  for (const t of UAT_ALL_TOOLS) {
    const v = state.verdicts[t.id] ?? "غير مجرّب";
    counts[v] += 1;
    counts.total += 1;
  }

  const now = new Date().toLocaleString("ar-SA", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const lines: string[] = [
    "# تقرير تقييم أدوات — مِقياس | جمعية الزاد",
    "",
    `تاريخ التقرير: ${now}`,
    "",
    "## الملخص",
    "",
    `| الإجمالي | يعتمد | يحتاج تحسين | غير مجرّب |`,
    `|----------|-------|-------------|-----------|`,
    `| ${counts.total} | ${counts["يعتمد"]} | ${counts["يحتاج تحسين"]} | ${counts["غير مجرّب"]} |`,
    "",
  ];

  for (const group of UAT_TOOL_GROUPS) {
    lines.push(`## ${group.title}`, "");
    for (const tool of group.tools) {
      const v = state.verdicts[tool.id] ?? "غير مجرّب";
      const note = state.notes[tool.id];
      const category = note?.category?.trim() || "—";
      const text = note?.text?.trim() || "—";
      lines.push(`### ${tool.tool}`);
      lines.push(`- المسار: \`${tool.path}\``);
      lines.push(`- الصلاحية: ${tool.permission}`);
      lines.push(`- التقييم: **${v}**`);
      lines.push(`- تصنيف الملاحظة: ${category}`);
      lines.push(`- ملاحظة: ${text}`);
      lines.push(`- ما يُتحقق منه:`);
      for (const c of tool.checks) lines.push(`  - ${c}`);
      lines.push("");
    }
  }

  lines.push("## خارج نطاق التجربة", "");
  for (const row of UAT_OUT_OF_SCOPE) {
    lines.push(`- **${row.item}**: ${row.note}`);
  }
  lines.push("");

  return lines.join("\n");
}
