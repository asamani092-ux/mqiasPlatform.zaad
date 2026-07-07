"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import DonutChart from "@/components/charts/DonutChart";
import DeviationCardModal, { type DeviationCardDetail } from "@/components/DeviationCardModal";
import {
  CARD_STATUS_BADGE,
  CARD_STATUS_LABEL,
  cardStatusDonutSegments,
  openActionsCount,
  summarizeDeviationCards,
  type DeviationSummary,
} from "@/lib/deviation-stats";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";

type Card = DeviationCardDetail;

const FILTER_TABS: { key: "" | "OPEN" | "IN_PROGRESS" | "CLOSED"; label: string }[] = [
  { key: "", label: "الكل" },
  { key: "OPEN", label: "مفتوحة" },
  { key: "IN_PROGRESS", label: "قيد المعالجة" },
  { key: "CLOSED", label: "مغلقة" },
];

export default function DeviationClient({
  initialCards,
  initialSummary,
  year,
  period,
  canManage,
  isAdmin,
}: {
  initialCards: Card[];
  initialSummary: DeviationSummary;
  year: number;
  period: Period;
  canManage: boolean;
  isAdmin: boolean;
}) {
  const [cards, setCards] = useState(initialCards);
  const [summary, setSummary] = useState(initialSummary);
  const [statusFilter, setStatusFilter] = useState<"" | "OPEN" | "IN_PROGRESS" | "CLOSED">("");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const q = new URLSearchParams({ year: String(year), period });
    if (statusFilter) q.set("status", statusFilter);
    const res = await fetch(`/api/deviation?${q}`);
    if (res.ok) {
      const data = await res.json();
      setCards(data.cards);
      setSummary(data.summary);
    }
  }, [year, period, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selectedCard) {
      const fresh = cards.find((c) => c.id === selectedCard.id);
      if (fresh) setSelectedCard(fresh);
    }
  }, [cards, selectedCard]);

  const donutSegments = useMemo(() => cardStatusDonutSegments(summary), [summary]);

  const statCards = [
    { num: summary.total, lbl: "إجمالي البطاقات", accent: "" },
    { num: summary.open, lbl: "مفتوحة", accent: "stat-card--warning" },
    { num: summary.inProgress, lbl: "قيد المعالجة", accent: "stat-card--secondary" },
    { num: summary.closed, lbl: "مغلقة", accent: "stat-card--success" },
    { num: summary.lateActions, lbl: "الإجراءات المتأخرة", accent: "stat-card--danger" },
  ];

  async function generateCards() {
    setMsg("");
    const res = await fetch("/api/deviation/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, period }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`تم توليد ${data.created} بطاقة`);
      await load();
    } else {
      setMsg(data.error || "فشل التوليد");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار بطاقة انحراف المؤشر</h1>
          <div className="text-muted">توثيق الانحرافات وإجراءات المعالجة — {PERIOD_LABEL[period]} {year}</div>
        </div>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
          {isAdmin && (
            <button type="button" className="btn-primary btn-sm" onClick={generateCards}>
              <Sparkles {...ICON_PROPS} />
              توليد بطاقات الانحراف
            </button>
          )}
          <PeriodSelector year={year} period={period} />
        </div>
      </div>

      {msg && (
        <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
          {msg}
        </div>
      )}

      <div className="tab-bar" style={{ marginBottom: "1rem" }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key || "all"}
            type="button"
            className={statusFilter === tab.key ? "active" : ""}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
        {statCards.map((s) => (
          <div key={s.lbl} className={`card stat-card ${s.accent}`.trim()}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>توزيع البطاقات حسب الحالة</h3>
        <DonutChart
          segments={donutSegments}
          centerLabel={summary.total > 0 ? String(summary.total) : "—"}
          centerSubLabel="بطاقة"
        />
      </div>

      <div className="kpi-grid">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            className="card kpi-card"
            style={{ textAlign: "start", cursor: "pointer", width: "100%" }}
            onClick={() => setSelectedCard(c)}
          >
            <div className="kpi-row">
              <span className="kpi-code">{c.kpi.code}</span>
              <span className={CARD_STATUS_BADGE[c.status] || "badge-secondary"}>
                {CARD_STATUS_LABEL[c.status] || c.status}
              </span>
            </div>
            <div className="kpi-name">{c.kpi.name}</div>
            <div className="text-muted" style={{ fontSize: ".78rem", marginBottom: ".5rem" }}>
              {PERIOD_LABEL[c.period as Period] || c.period} {c.year}
            </div>
            <div className="kpi-fields">
              <div className="field">
                <div className="field-lbl">الانحراف</div>
                <div className="field-val">{c.deviationPct}%</div>
              </div>
              <div className="field">
                <div className="field-lbl">إجراءات مفتوحة</div>
                <div className="field-val">{openActionsCount(c.actions)}</div>
              </div>
              <div className="field">
                <div className="field-lbl">المستهدف</div>
                <div className="field-val">{c.targetValue}</div>
              </div>
            </div>
            <p className="text-muted" style={{ fontSize: ".75rem", marginTop: ".5rem" }}>
              {c.reasons.length > 90 ? `${c.reasons.slice(0, 90)}…` : c.reasons}
            </p>
          </button>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="card">
          <p className="text-muted">لا توجد بطاقات لهذه الفترة.</p>
        </div>
      )}

      {selectedCard && (
        <DeviationCardModal
          card={selectedCard}
          year={year}
          period={period}
          canManage={canManage}
          onClose={() => setSelectedCard(null)}
          onUpdated={load}
        />
      )}
    </>
  );
}
