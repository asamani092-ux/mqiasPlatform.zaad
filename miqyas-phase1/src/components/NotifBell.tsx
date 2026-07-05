"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function NotifBell() {
  const { data: session } = useSession();
  if (!session) return null;

  return (
    <Link href="/dashboard" className="btn-secondary btn-sm notif-dot" title="الإشعارات">
      🔔
    </Link>
  );
}
