"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ROLE_LABEL } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "اللوحة الرئيسية", icon: "📊" },
];

export default function Sidebar({ user }: { user: { name: string; role: string } }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>مِقياس</h2>
        <p>منصة قياس الأداء المؤسسي</p>
      </div>
      <nav className="sidebar-nav">
        {NAV.map((item) => (
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
