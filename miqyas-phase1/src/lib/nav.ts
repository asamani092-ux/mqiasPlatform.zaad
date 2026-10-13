import type { Role } from "@prisma/client";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Crown,
  FileStack,
  FileText,
  FileWarning,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  Library,
  ListTodo,
  Presentation,
  Ruler,
  Settings,
  Settings2,
  Shield,
  Target,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PhaseId } from "@/lib/phase-registry";

export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** وسم المرحلة للتجربة — انظر phase-registry */
  badge?: PhaseId;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
  /** قسم قابل للطي — مغلق افتراضياً إن لم يُحدَّد */
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export type NavFlags = {
  showApprovals?: boolean;
  showUat?: boolean;
  /** عضو مكتب الاستراتيجية (قسم الاستراتيجية) */
  strategyOffice?: boolean;
};

const DASHBOARD_NAV: NavItem = {
  href: "/dashboard",
  label: "اللوحة الرئيسية",
  Icon: LayoutDashboard,
  badge: "core",
};

const MY_NAV: NavItem = {
  href: "/my",
  label: "شواهد المؤشرات",
  Icon: ClipboardList,
  badge: "core",
};

const DEPT_FOLLOW_NAV: NavItem = {
  href: "/dept-follow",
  label: "مراجعة الإدارة",
  Icon: Building2,
  badge: "core",
};

/** أدوات م1 (الاسم الداخلي v2 يُبقى حتى انتهاء التطوير بالكامل) */
const STRATEGY_V2_NAV: NavItem[] = [
  { href: "/strategy", label: "كتالوج الاستراتيجية والحوكمة", Icon: Library, badge: "m1" },
  { href: "/calendar", label: "رزنامة القسم", Icon: CalendarDays, badge: "m1" },
];

/** كل مسارات القياس (للمشرف/التنفيذي) */
const TRACK_NAV_FULL: NavItem[] = [
  { href: "/strategic", label: "المسار الاستراتيجي", Icon: Target, badge: "core" },
  { href: "/operational", label: "المسار التشغيلي", Icon: Settings, badge: "core" },
  { href: "/early-warning", label: "الإنذار المبكر", Icon: AlertTriangle, badge: "core" },
  { href: "/deviation", label: "بطاقات الانحراف", Icon: FileWarning, badge: "core" },
  { href: "/governance", label: "الحوكمة", Icon: Landmark, badge: "core" },
  { href: "/knowledge", label: "المعرفة المؤسسية", Icon: BookOpen, badge: "core" },
];

/** مسارات القياس المتاحة لمكتب الاستراتيجية / المدراء */
const TRACK_NAV_OFFICE: NavItem[] = [
  { href: "/strategic", label: "المسار الاستراتيجي", Icon: Target, badge: "core" },
  { href: "/governance", label: "الحوكمة", Icon: Landmark, badge: "core" },
];

const ASSIGN_NAV: NavItem = {
  href: "/admin/assign",
  label: "إسناد المسؤولين",
  Icon: UserPlus,
  badge: "core",
};

const KPIS_NAV: NavItem = {
  href: "/admin/kpis",
  label: "إدارة المؤشرات",
  Icon: Ruler,
  badge: "core",
};

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/users", label: "إدارة المستخدمين", Icon: Users, badge: "core" },
  KPIS_NAV,
  ASSIGN_NAV,
  { href: "/admin/report", label: "منشئ العرض التقديمي", Icon: Presentation, badge: "core" },
  { href: "/admin/settings", label: "إعدادات النظام", Icon: Settings2, badge: "core" },
];

const EXECUTIVE_NAV: NavItem = {
  href: "/executive",
  label: "لوحة الإدارة التنفيذية",
  Icon: Crown,
  badge: "core",
};

const APPROVALS_NAV: NavItem = {
  href: "/approvals",
  label: "الاعتماد النهائي",
  Icon: CheckCircle2,
  badge: "core",
};

const UAT_NAV: NavItem = {
  href: "/uat",
  label: "تقييم الأدوات",
  Icon: ClipboardCheck,
  badge: "uat",
};

/** أدوات م2 — المراجعة الداخلية */
const AUDIT_NAV_CORE: NavItem[] = [
  { href: "/audit", label: "ملخص المراجعة", Icon: Shield, badge: "m2" },
  { href: "/audit/plan", label: "الخطة السنوية", Icon: FolderKanban, badge: "m2" },
  { href: "/audit/engagements", label: "المهام والبرامج", Icon: ListTodo, badge: "m2" },
  { href: "/audit/findings", label: "الملاحظات والمخاطر", Icon: FileWarning, badge: "m2" },
  { href: "/audit/reports", label: "التقارير الصادرة", Icon: FileText, badge: "m2" },
];

const AUDIT_PAPERS_NAV: NavItem = {
  href: "/audit/papers",
  label: "أوراق العمل",
  Icon: FileStack,
  badge: "m2",
};

function auditSection(includePapers: boolean): NavSection {
  return {
    label: "المراجعة الداخلية",
    items: includePapers ? [...AUDIT_NAV_CORE, AUDIT_PAPERS_NAV] : AUDIT_NAV_CORE,
  };
}

function tracksSection(items: NavItem[]): NavSection {
  return {
    label: "مسارات القياس",
    items,
    collapsible: true,
    defaultOpen: false,
  };
}

/** بناء أقسام التنقّل حسب الدور — تراكمياً دون حذف مسارات */
export function buildNavSections(role: Role, flags: NavFlags = {}): NavSection[] {
  const { showApprovals = false, showUat = false, strategyOffice = false } = flags;
  const sections: NavSection[] = [];

  if (role === "INTERNAL_AUDITOR") {
    sections.push(auditSection(true));
    return sections;
  }

  if (role === "EMPLOYEE") {
    sections.push({ label: "الرئيسية", items: [MY_NAV] });
    if (strategyOffice) {
      sections.push(tracksSection(TRACK_NAV_OFFICE));
      sections.push({
        label: "مكتب الاستراتيجية",
        items: [...STRATEGY_V2_NAV, KPIS_NAV],
      });
    }
    return sections;
  }

  if (role === "SECTION_HEAD") {
    sections.push({ label: "الرئيسية", items: [MY_NAV] });
    sections.push(tracksSection(TRACK_NAV_OFFICE));
    sections.push({
      label: "مكتب الاستراتيجية",
      items: strategyOffice ? [...STRATEGY_V2_NAV, KPIS_NAV] : STRATEGY_V2_NAV,
    });
    return sections;
  }

  if (role === "DEPT_MANAGER") {
    sections.push({
      label: "الرئيسية",
      items: [MY_NAV, DEPT_FOLLOW_NAV, ASSIGN_NAV, KPIS_NAV],
    });
    sections.push(tracksSection(TRACK_NAV_OFFICE));
    sections.push({ label: "مكتب الاستراتيجية", items: STRATEGY_V2_NAV });
    return sections;
  }

  if (role === "EXECUTIVE") {
    sections.push({ items: [EXECUTIVE_NAV] });
    sections.push({ label: "الرئيسية", items: [DASHBOARD_NAV] });
    sections.push(tracksSection(TRACK_NAV_FULL));
    sections.push({ label: "مكتب الاستراتيجية", items: STRATEGY_V2_NAV });
    sections.push(auditSection(false));
    return sections;
  }

  // SYSTEM_ADMIN
  sections.push({ items: [EXECUTIVE_NAV] });
  sections.push({ label: "الرئيسية", items: [DASHBOARD_NAV, MY_NAV] });
  sections.push(tracksSection(TRACK_NAV_FULL));
  sections.push({ label: "مكتب الاستراتيجية", items: STRATEGY_V2_NAV });
  sections.push(auditSection(true));
  if (showApprovals) sections.push({ items: [APPROVALS_NAV] });
  sections.push({ label: "إدارة النظام", items: ADMIN_NAV });
  if (showUat) sections.push({ label: "بيئة التجربة", items: [UAT_NAV] });

  return sections;
}
