"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { buildNavSections } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";

/**
 * مُهمل بصرياً — القشرة الحالية هي AppShell (شريط علوي + درج).
 * يُبقى للتوافق إن وُجدت استيرادات قديمة.
 */
export default function Sidebar({
  user,
  showApprovals,
  isAdmin,
  showExecutive,
  showUat = false,
}: {
  user: { name: string; role: string };
  showApprovals: boolean;
  isAdmin: boolean;
  showExecutive?: boolean;
  showUat?: boolean;
}) {
  const pathname = usePathname();
  const sections = buildNavSections(!!showExecutive, showApprovals, isAdmin, showUat);

  return (
    <aside className="nav-drawer" style={{ position: "relative", height: "auto", minHeight: "100vh" }}>
      <div className="nav-drawer-header">
        <div className="nav-drawer-brand">
          <span className="app-product-name app-product-name--drawer">مِقياس</span>
        </div>
      </div>
      <nav className="nav-drawer-nav">
        {sections.map((section) => (
          <div key={section.label ?? section.items[0]?.href} className="nav-drawer-section">
            {section.label && <div className="nav-drawer-section-label">{section.label}</div>}
            {section.items.map((item) => {
              const { Icon } = item;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-drawer-link${pathname === item.href ? " active" : ""}`}
                >
                  <Icon {...ICON_PROPS} className="nav-drawer-link-icon" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="nav-drawer-footer">
        <div className="app-user-name">{user.name}</div>
        <div className="app-user-role">{ROLE_LABEL[user.role] || user.role}</div>
        <button
          type="button"
          className="btn-secondary btn-sm"
          style={{ marginTop: "0.75rem", width: "100%" }}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut {...ICON_PROPS} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
