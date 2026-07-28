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
  Upload,
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

const TRACK_NAV: NavItem[] = [
  { href: "/strategic", label: "المسار الاستراتيجي", Icon: Target },
  { href: "/operational", label: "المسار التشغيلي", Icon: Settings },
  { href: "/early-warning", label: "الإنذار المبكر", Icon: AlertTriangle },
  { href: "/deviation", label: "بطاقات الانحراف", Icon: FileWarning },
  { href: "/governance", label: "الحوكمة", Icon: Landmark },
  { href: "/knowledge", label: "المعرفة المؤسسية", Icon: BookOpen },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/users", label: "إدارة المستخدمين", Icon: Users },
  { href: "/admin/kpis", label: "إدارة المؤشرات", Icon: Ruler },
  { href: "/admin/import", label: "استيراد Excel", Icon: Upload },
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

/** بناء أقسام التنقّل — زمن O(1) · مساحة O(1) بالنسبة لعدد الأقسام الثابت */
export function buildNavSections(
  showExecutive: boolean,
  showApprovals: boolean,
  isAdmin: boolean,
  showUat: boolean,
): NavSection[] {
  const sections: NavSection[] = [];

  if (showExecutive) {
    sections.push({ items: [EXECUTIVE_NAV] });
  }

  sections.push({
    label: "الرئيسية",
    items: [
      { href: "/dashboard", label: "اللوحة الرئيسية", Icon: LayoutDashboard },
      { href: "/my", label: "مهامي ومؤشراتي", Icon: ClipboardList },
    ],
  });

  sections.push({ label: "مسارات القياس", items: TRACK_NAV });

  if (showApprovals) {
    sections.push({ items: [APPROVALS_NAV] });
  }

  if (isAdmin) {
    sections.push({ label: "إدارة النظام", items: ADMIN_NAV });
  }

  if (showUat) {
    sections.push({ label: "بيئة التجربة", items: [UAT_NAV] });
  }

  return sections;
}
