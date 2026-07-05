"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ROLE_LABEL } from "@/lib/types";

const TRACK_NAV = [
  { href: "/strategic", label: "المسار الاستراتيجي", icon: "🎯" },
  { href: "/operational", label: "المسار التشغيلي", icon: "⚙️" },
  { href: "/early-warning", label: "الإنذار المبكر", icon: "⚠️" },
  { href: "/deviation", label: "بطاقات الانحراف", icon: "📉" },
  { href: "/governance", label: "الحوكمة", icon: "🏛️" },
  { href: "/knowledge", label: "المعرفة المؤسسية", icon: "📚" },
];

const BASE_NAV = [
  { href: "/dashboard", label: "اللوحة الرئيسية", icon: "📊" },
  { href: "/my", label: "مهامي ومؤشراتي", icon: "📋" },
  ...TRACK_NAV,
];

const ADMIN_NAV = [
  { href: "/admin/kpis", label: "إدارة المؤشرات", icon: "⚙️" },
  { href: "/admin/import", label: "استيراد Excel", icon: "📥" },
  { href: "/admin/settings", label: "إعدادات النظام", icon: "🔧" },
];

export default function Sidebar({
  user,
  showApprovals,
  isAdmin,
}: {
  user: { name: string; role: string };
  showApprovals: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  let nav = [...BASE_NAV];
  if (showApprovals) nav.push({ href: "/approvals", label: "اعتماد القياسات", icon: "✅" });
  if (isAdmin) nav = [...nav, ...ADMIN_NAV];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>مِقياس</h2>
        <p>منصة قياس الأداء المؤسسي</p>
      </div>
      <nav className="sidebar-nav">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${pathname === item.href ? " active" : ""}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: ".25rem" }}>
          {user.name}
        </div>
        <div>{ROLE_LABEL[user.role] || user.role}</div>
        <button
          type="button"
          className="btn-ghost btn-sm"
          style={{ marginTop: ".75rem", width: "100%", color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.15)" }}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
