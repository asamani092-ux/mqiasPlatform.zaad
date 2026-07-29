import type { Role } from "@prisma/client";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Crown,
  FileWarning,
  Landmark,
  LayoutDashboard,
  Ruler,
  Settings,
  Settings2,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

export type NavFlags = {
  showApprovals?: boolean;
  showUat?: boolean;
};

const DASHBOARD_NAV: NavItem = {
  href: "/dashboard",
  label: "اللوحة الرئيسية",
  Icon: LayoutDashboard,
};

const MY_NAV: NavItem = {
  href: "/my",
  label: "مهامي ومؤشراتي",
  Icon: ClipboardList,
};

const TRACK_NAV: NavItem[] = [
  { href: "/strategic", label: "المسار الاستراتيجي", Icon: Target },
  { href: "/operational", label: "المسار التشغيلي", Icon: Settings },
  { href: "/early-warning", label: "الإنذار المبكر", Icon: AlertTriangle },
  { href: "/deviation", label: "بطاقات الانحراف", Icon: FileWarning },
  { href: "/governance", label: "الحوكمة", Icon: Landmark },
  { href: "/knowledge", label: "المعرفة المؤسسية", Icon: BookOpen },
];

/** مسارات القياس المسموحة لكل دور (فارغ = لا مسارات) */
const TRACK_HREFS_BY_ROLE: Record<Role, ReadonlySet<string> | "all"> = {
  EMPLOYEE: new Set(),
  SECTION_HEAD: new Set(["/operational", "/early-warning", "/deviation"]),
  DEPT_MANAGER: new Set(["/operational", "/early-warning", "/deviation", "/knowledge"]),
  EXECUTIVE: "all",
  SYSTEM_ADMIN: "all",
};

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/users", label: "إدارة المستخدمين", Icon: Users },
  { href: "/admin/kpis", label: "إدارة المؤشرات", Icon: Ruler },
  { href: "/admin/settings", label: "إعدادات النظام", Icon: Settings2 },
];

const EXECUTIVE_NAV: NavItem = {
  href: "/executive",
  label: "لوحة الإدارة العليا",
  Icon: Crown,
};

const APPROVALS_NAV: NavItem = {
  href: "/approvals",
  label: "اعتماد القياسات",
  Icon: CheckCircle2,
};

const UAT_NAV: NavItem = {
  href: "/uat",
  label: "تقييم الأدوات",
  Icon: ClipboardCheck,
};

function tracksForRole(role: Role): NavItem[] {
  const allowed = TRACK_HREFS_BY_ROLE[role];
  if (allowed === "all") return TRACK_NAV;
  if (!allowed || allowed.size === 0) return [];
  return TRACK_NAV.filter((item) => allowed.has(item.href));
}

/** بناء أقسام التنقّل حسب الدور والأعلام — زمن O(1) · مساحة O(1) بالنسبة لعدد الأقسام الثابت */
export function buildNavSections(role: Role, flags: NavFlags = {}): NavSection[] {
  const { showApprovals = false, showUat = false } = flags;
  const isAdmin = role === "SYSTEM_ADMIN";
  const showExecutive = isAdmin || role === "EXECUTIVE";
  const showMy = role !== "EXECUTIVE";
  const sections: NavSection[] = [];

  if (showExecutive) {
    sections.push({ items: [EXECUTIVE_NAV] });
  }

  const homeItems: NavItem[] = [DASHBOARD_NAV];
  if (showMy) homeItems.push(MY_NAV);

  sections.push({
    label: "الرئيسية",
    items: homeItems,
  });

  const tracks = tracksForRole(role);
  if (tracks.length > 0) {
    sections.push({ label: "مسارات القياس", items: tracks });
  }

  if (showApprovals && (isAdmin || role === "SECTION_HEAD")) {
    sections.push({ items: [APPROVALS_NAV] });
  }

  if (isAdmin) {
    sections.push({ label: "إدارة النظام", items: ADMIN_NAV });
  }

  if (showUat && isAdmin) {
    sections.push({ label: "بيئة التجربة", items: [UAT_NAV] });
  }

  return sections;
}
