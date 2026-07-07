"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { ICON_PROPS } from "@/lib/icon-props";

type Notification = {
  id: number;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

export default function NotifBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
    }
  }, []);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  if (!session) return null;

  const unread = notifications.filter((n) => !n.readAt).length;

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await fetch("/api/notifications", { method: "POST" });
      load();
    }
  }

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label="الإشعارات"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <Bell {...ICON_PROPS} />
        {unread > 0 && (
          <span className="badge-danger notif-unread-badge">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="card notif-dropdown">
          <div className="notif-dropdown-header">
            <strong style={{ color: "var(--tmkeen-primary)" }}>الإشعارات</strong>
          </div>
          {notifications.length === 0 ? (
            <p className="text-muted" style={{ margin: 0, padding: "0.75rem 0" }}>
              لا توجد إشعارات
            </p>
          ) : (
            <ul className="notif-list">
              {notifications.map((n) => (
                <li key={n.id} className={n.readAt ? "notif-item read" : "notif-item"}>
                  {n.link ? (
                    <Link href={n.link} className="notif-item-link" onClick={() => setOpen(false)}>
                      <div className="notif-item-title">{n.title}</div>
                      {n.body && <div className="notif-item-body">{n.body}</div>}
                      <div className="notif-item-time">{fmtTime(n.createdAt)}</div>
                    </Link>
                  ) : (
                    <div>
                      <div className="notif-item-title">{n.title}</div>
                      {n.body && <div className="notif-item-body">{n.body}</div>}
                      <div className="notif-item-time">{fmtTime(n.createdAt)}</div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
