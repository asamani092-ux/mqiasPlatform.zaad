"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { notifyToast } from "@/lib/ui-toast";

type Summary = {
  plansActive: number;
  engagementsOpen: number;
  findingsOpen: number;
  findingsHigh: number;
  findingsClosed: number;
  findingsTotal: number;
  closurePct: number;
  actionsPending: number;
  reportsIssued: number;
};

export default function AuditSummaryClient({
  canManage,
  canManagePapers,
}: {
  canManage: boolean;
  canManagePapers: boolean;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/audit/summary");
      if (!res.ok) {
        notifyToast.error("تعذّر تحميل الملخص");
        return;
      }
      const data = await res.json();
      setSummary(data.summary);
    })();
  }, []);

  const cards = summary
    ? [
        { label: "خطط نشطة", value: summary.plansActive, href: "/audit/plan" },
        { label: "مهام مفتوحة", value: summary.engagementsOpen, href: "/audit/engagements" },
        { label: "ملاحظات مفتوحة", value: summary.findingsOpen, href: "/audit/findings" },
        { label: "عالية/حرجة", value: summary.findingsHigh, href: "/audit/findings" },
        { label: "نسبة الإغلاق", value: `${summary.closurePct}%`, href: "/audit/findings" },
        { label: "إجراءات معلّقة", value: summary.actionsPending, href: "/audit/findings" },
        { label: "تقارير صادرة", value: summary.reportsIssued, href: "/audit/reports" },
      ]
    : [];

  return (
    <div className="stack-lg">
      <p className="muted">
        وحدة المراجعة الداخلية (م2) مدموجة تحت المنصة دون استبدال مسارات القياس.
        {!canManage && " عرض الملخص والتقارير الصادرة فقط."}
      </p>

      <div className="grid-2" style={{ gap: "1rem" }}>
        {summary == null ? (
          <p className="muted">جاري التحميل…</p>
        ) : (
          cards.map((c) => (
            <Link key={c.label} href={c.href} className="card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="muted" style={{ fontSize: "0.85rem" }}>{c.label}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{c.value}</div>
            </Link>
          ))
        )}
      </div>

      <div className="row gap" style={{ flexWrap: "wrap" }}>
        <Link className="btn btn-primary" href="/audit/plan">الخطة السنوية</Link>
        <Link className="btn btn-ghost" href="/audit/engagements">المهام</Link>
        <Link className="btn btn-ghost" href="/audit/findings">الملاحظات</Link>
        <Link className="btn btn-ghost" href="/audit/reports">التقارير</Link>
        {canManagePapers && (
          <Link className="btn btn-ghost" href="/audit/papers">أوراق العمل</Link>
        )}
      </div>
    </div>
  );
}
