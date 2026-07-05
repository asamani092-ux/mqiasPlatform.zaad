"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Crown,
  FileWarning,
  Landmark,
  LayoutDashboard,
  LogOut,
  Ruler,
  Settings,
  Settings2,
  Target,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ROLE_LABEL } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

const TRACK_NAV: NavItem[] = [
  { href: "/strategic", label: "المسار الاستراتيجي", Icon: Target },
  { href: "/operational", label: "المسار التشغيلي", Icon: Settings },
  { href: "/early-warning", label: "الإنذار المبكر", Icon: AlertTriangle },
  { href: "/deviation", label: "بطاقات الانحراف", Icon: FileWarning },
  { href: "/governance", label: "الحوكمة", Icon: Landmark },
  { href: "/knowledge", label: "المعرفة المؤسسية", Icon: BookOpen },
];

const BASE_NAV: NavItem[] = [
  { href: "/dashboard", label: "اللوحة الرئيسية", Icon: LayoutDashboard },
  { href: "/my", label: "مهامي ومؤشراتي", Icon: ClipboardList },
  ...TRACK_NAV,
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

export default function Sidebar({
  user,
  showApprovals,
  isAdmin,
  showExecutive,
}: {
  user: { name: string; role: string };
  showApprovals: boolean;
  isAdmin: boolean;
  showExecutive?: boolean;
}) {
  const pathname = usePathname();

  let nav: NavItem[] = [...BASE_NAV];
  if (showExecutive) nav.unshift(EXECUTIVE_NAV);
  if (showApprovals) nav.push(APPROVALS_NAV);
  if (isAdmin) nav = [...nav, ...ADMIN_NAV];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <h2>مِقياس</h2>
        <p>منصة قياس الأداء المؤسسي</p>
      </div>
      <nav className="sidebar-nav">
        {nav.map((item) => {
          const { Icon } = item;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${pathname === item.href ? " active" : ""}`}
            >
              <Icon {...ICON_PROPS} className="nav-link-icon" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div style={{ fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: ".25rem" }}>
          {user.name}
        </div>
        <div>{ROLE_LABEL[user.role] || user.role}</div>
        <button
          type="button"
          className="btn-secondary btn-sm sidebar-logout"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut {...ICON_PROPS} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
