"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu, X } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import NotifBell from "@/components/NotifBell";
import { buildNavSections } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";

export default function AppShell({
  user,
  showApprovals,
  isAdmin,
  showExecutive,
  showUat = false,
  children,
}: {
  user: { name: string; role: string };
  showApprovals: boolean;
  isAdmin: boolean;
  showExecutive?: boolean;
  showUat?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const sections = buildNavSections(!!showExecutive, showApprovals, isAdmin, showUat);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="app-shell">
      <header className="app-topbar-bar">
        <div className="app-topbar-start">
          <button
            type="button"
            className="icon-btn app-menu-btn"
            aria-label="فتح القائمة"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu {...ICON_PROPS} />
          </button>
          <Link href="/dashboard" className="app-topbar-brand-link">
            <BrandMark variant="topbar" />
            <span className="app-product-name">مِقياس</span>
          </Link>
        </div>
        <div className="app-topbar-end">
          <NotifBell />
          <div className="app-user-chip">
            <div className="app-user-name">{user.name}</div>
            <div className="app-user-role">{ROLE_LABEL[user.role] || user.role}</div>
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              void signOut({ callbackUrl: "/login" });
            }}
          >
            <LogOut {...ICON_PROPS} />
            {signingOut ? "جاري الخروج..." : "خروج"}
          </button>
        </div>
      </header>

      {open && (
        <div className="nav-drawer-overlay" onClick={() => setOpen(false)} role="presentation">
          <aside
            className="nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="قائمة التنقّل"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="nav-drawer-header">
              <div className="nav-drawer-brand">
                <BrandMark variant="drawer" />
                <span className="app-product-name app-product-name--drawer">مِقياس</span>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="إغلاق القائمة"
                onClick={() => setOpen(false)}
              >
                <X {...ICON_PROPS} />
              </button>
            </div>

            <nav className="nav-drawer-nav">
              {sections.map((section) => (
                <div key={section.label ?? section.items[0]?.href} className="nav-drawer-section">
                  {section.label && (
                    <div className="nav-drawer-section-label">{section.label}</div>
                  )}
                  {section.items.map((item) => {
                    const { Icon } = item;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-drawer-link${active ? " active" : ""}`}
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
              <div className="text-muted" style={{ marginTop: "0.25rem" }}>
                جمعية الزاد
              </div>
            </div>
          </aside>
        </div>
      )}

      <main className="app-main">{children}</main>
    </div>
  );
}
