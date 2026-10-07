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
  FileWarning,
  Landmark,
  LayoutDashboard,
  Library,
  Presentation,
  Ruler,
  Settings,
  Settings2,
  Target,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** وسم أدوات مكتب الاستراتيجية الجديدة فقط */
  badge?: "v2";
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
};

const MY_NAV: NavItem = {
  href: "/my",
  label: "شواهد المؤشرات",
  Icon: ClipboardList,
};

const DEPT_FOLLOW_NAV: NavItem = {
  href: "/dept-follow",
  label: "مراجعة الإدارة",
  Icon: Building2,
};

/** أدوات v2 — قراءة الكتالوج + الرزنامة */
const STRATEGY_V2_NAV: NavItem[] = [
  { href: "/strategy", label: "كتالوج الاستراتيجية والحوكمة", Icon: Library, badge: "v2" },
  { href: "/calendar", label: "رزنامة القسم", Icon: CalendarDays, badge: "v2" },
];

/** كل مسارات القياس (للمشرف/التنفيذي) */
const TRACK_NAV_FULL: NavItem[] = [
  { href: "/strategic", label: "المسار الاستراتيجي", Icon: Target },
  { href: "/operational", label: "المسار التشغيلي", Icon: Settings },
  { href: "/early-warning", label: "الإنذار المبكر", Icon: AlertTriangle },
  { href: "/deviation", label: "بطاقات الانحراف", Icon: FileWarning },
  { href: "/governance", label: "الحوكمة", Icon: Landmark },
  { href: "/knowledge", label: "المعرفة المؤسسية", Icon: BookOpen },
];

/** مسارات القياس المتاحة لمكتب الاستراتيجية / المدراء */
const TRACK_NAV_OFFICE: NavItem[] = [
  { href: "/strategic", label: "المسار الاستراتيجي", Icon: Target },
  { href: "/governance", label: "الحوكمة", Icon: Landmark },
];

const ASSIGN_NAV: NavItem = {
  href: "/admin/assign",
  label: "إسناد المسؤولين",
  Icon: UserPlus,
};

const KPIS_NAV: NavItem = {
  href: "/admin/kpis",
  label: "إدارة المؤشرات",
  Icon: Ruler,
};

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/users", label: "إدارة المستخدمين", Icon: Users },
  KPIS_NAV,
  ASSIGN_NAV,
  { href: "/admin/report", label: "منشئ العرض التقديمي", Icon: Presentation },
  { href: "/admin/settings", label: "إعدادات النظام", Icon: Settings2 },
];

const EXECUTIVE_NAV: NavItem = {
  href: "/executive",
  label: "لوحة الإدارة التنفيذية",
  Icon: Crown,
};

const APPROVALS_NAV: NavItem = {
  href: "/approvals",
  label: "الاعتماد النهائي",
  Icon: CheckCircle2,
};

const UAT_NAV: NavItem = {
  href: "/uat",
  label: "تقييم الأدوات",
  Icon: ClipboardCheck,
};

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
    return sections;
  }

  // SYSTEM_ADMIN
  sections.push({ items: [EXECUTIVE_NAV] });
  sections.push({ label: "الرئيسية", items: [DASHBOARD_NAV, MY_NAV] });
  sections.push(tracksSection(TRACK_NAV_FULL));
  sections.push({ label: "مكتب الاستراتيجية", items: STRATEGY_V2_NAV });
  if (showApprovals) sections.push({ items: [APPROVALS_NAV] });
  sections.push({ label: "إدارة النظام", items: ADMIN_NAV });
  if (showUat) sections.push({ label: "بيئة التجربة", items: [UAT_NAV] });

  return sections;
}
