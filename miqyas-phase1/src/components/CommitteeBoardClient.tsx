"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUDIT_SEVERITY_LABEL, AUDIT_FINDING_STATUS_LABEL } from "@/lib/audit-labels";
import { notifyToast } from "@/lib/ui-toast";

type Summary = {
  findingsOpen: number;
  findingsHigh: number;
  findingsClosed: number;
  findingsLate: number;
  closurePct: number;
  actionPct: number;
  planPct: number;
  reportsIssued: number;
  reportsPending: number;
  decisionsOpen: number;
  decisionsDone: number;
  uploadsPending: number;
};

type Risk = { id: number; title: string; severity: string; status: string };

export default function CommitteeBoardClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/committee/summary");
      if (!res.ok) {
        notifyToast.error("تعذّر تحميل لوحة اللجنة");
        return;
      }
      const data = await res.json();
      setSummary(data.summary);
      setRisks(data.topRisks ?? []);
    })();
  }, []);

  const cards = summary
    ? [
        { label: "ملاحظات مفتوحة", value: summary.findingsOpen },
        { label: "ملاحظات مغلقة", value: summary.findingsClosed },
        { label: "عالية/حرجة", value: summary.findingsHigh },
        { label: "ملاحظات متأخرة", value: summary.findingsLate },
        { label: "نسبة إغلاق الملاحظات", value: `${summary.closurePct}%` },
        { label: "نسبة تنفيذ الإجراءات", value: `${summary.actionPct}%` },
        { label: "تقارير صادرة لكل خطة نشطة", value: `${summary.planPct}%` },
        { label: "تقارير صادرة", value: summary.reportsIssued },
        { label: "تقارير بانتظار الإصدار", value: summary.reportsPending },
        { label: "توصيات مفتوحة", value: summary.decisionsOpen },
        { label: "توصيات منفذة", value: summary.decisionsDone },
        { label: "رفع خارجي بانتظار الاطلاع", value: summary.uploadsPending },
      ]
    : [];

  return (
    <div className="stack-lg">
      <p className="muted">لوحة لجنة المراجعة تقرأ ملخص المراجعة الصادرة دون أوراق العمل السرية.</p>
      <div className="grid-2" style={{ gap: "1rem" }}>
        {summary == null ? (
          <p className="muted">جاري التحميل…</p>
        ) : (
          cards.map((c) => (
            <div key={c.label} className="card">
              <div className="muted" style={{ fontSize: "0.85rem" }}>{c.label}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{c.value}</div>
            </div>
          ))
        )}
      </div>
      <div className="card stack">
        <h2 className="section-title">أهم المخاطر المفتوحة</h2>
        {risks.length === 0 ? (
          <p className="muted">لا توجد ملاحظات عالية أو حرجة مفتوحة.</p>
        ) : (
          <ul>
            {risks.map((r) => (
              <li key={r.id}>
                {r.title} — {AUDIT_SEVERITY_LABEL[r.severity] || r.severity} · {AUDIT_FINDING_STATUS_LABEL[r.status] || r.status}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="row gap" style={{ flexWrap: "wrap" }}>
        <Link className="btn btn-primary" href="/committee/meetings">الاجتماعات</Link>
        <Link className="btn btn-ghost" href="/committee/minutes">المحاضر</Link>
        <Link className="btn btn-ghost" href="/committee/decisions">القرارات</Link>
        <Link className="btn btn-ghost" href="/committee/inbox">التقارير</Link>
      </div>
    </div>
  );
}
