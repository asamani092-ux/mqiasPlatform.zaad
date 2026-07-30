"use client";

import { useCallback, useState } from "react";
import PeriodSelector from "@/components/PeriodSelector";
import DonutChart from "@/components/charts/DonutChart";
import DeviationCardModal, { type DeviationCardDetail } from "@/components/DeviationCardModal";
import {
  EARLY_WARNING_ACHIEVEMENT_THRESHOLD,
  RISK_BADGE,
  riskDonutSegments,
  type EarlyWarningRow,
  type EarlyWarningSummary,
} from "@/lib/early-warning-stats";
import { PERIOD_LABEL, type Period } from "@/lib/types";

function fmtNum(n: number): string {
  return n.toLocaleString("ar-SA", { maximumFractionDigits: 1 });
}

function serializeCard(raw: Record<string, unknown>): DeviationCardDetail {
  const actions = (raw.actions as Record<string, unknown>[] | undefined) ?? [];
  return {
    ...(raw as unknown as DeviationCardDetail),
    actions: actions.map((a) => ({
      ...(a as DeviationCardDetail["actions"][number]),
      dueDate:
        typeof a.dueDate === "string"
          ? a.dueDate
          : new Date(a.dueDate as string).toISOString(),
    })),
  };
}

export default function EarlyWarningClient({
  rows: initialRows,
  summary,
  year,
  period,
  canManage,
}: {
  rows: EarlyWarningRow[];
  summary: EarlyWarningSummary;
  year: number;
  period: Period;
  canManage: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [selectedCard, setSelectedCard] = useState<DeviationCardDetail | null>(null);
  const [busyKpiId, setBusyKpiId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const donutSegments = riskDonutSegments(rows);

  const statCards = [
    { num: summary.activeCount, lbl: "المؤشرات تحت العتبة", accent: "stat-card--danger" },
    { num: summary.highCount, lbl: "مرتفع", accent: "stat-card--danger" },
    { num: summary.mediumCount, lbl: "متوسط", accent: "stat-card--warning" },
    { num: summary.lowCount, lbl: "منخفض", accent: "stat-card--success" },
  ];

  const openCard = useCallback(async (cardId: number) => {
    setMsg("");
    setBusyKpiId(cardId);
    try {
      const res = await fetch(`/api/deviation/${cardId}`);
      const data = await res.json();
      if (res.ok && data.card) {
        setSelectedCard(serializeCard(data.card));
      } else {
        setMsg(data.error || "تعذر فتح بطاقة الانحراف");
      }
    } finally {
      setBusyKpiId(null);
    }
  }, []);

  const generateCard = useCallback(
    async (kpiId: number) => {
      setMsg("");
      setBusyKpiId(kpiId);
      try {
        const res = await fetch("/api/deviation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kpiId,
            year,
            period,
            reasons: "توليد من مسار الإنذار المبكر — أداء دون العتبة",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMsg(data.error || "فشل إنشاء بطاقة الانحراف");
          return;
        }
        const cardId = data.card?.id as number | undefined;
        if (cardId == null) {
          setMsg("تم الإنشاء دون معرّف بطاقة");
          return;
        }
        setRows((prev) =>
          prev.map((r) => (r.kpiId === kpiId ? { ...r, deviationCardId: cardId } : r)),
        );
        const detailRes = await fetch(`/api/deviation/${cardId}`);
        const detailData = await detailRes.json();
        if (detailRes.ok && detailData.card) {
          setSelectedCard(serializeCard(detailData.card));
        }
      } finally {
        setBusyKpiId(null);
      }
    },
    [year, period],
  );

  const refreshSelected = useCallback(async () => {
    if (!selectedCard) return;
    const res = await fetch(`/api/deviation/${selectedCard.id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.card) setSelectedCard(serializeCard(data.card));
    }
  }, [selectedCard]);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار الإنذار المبكر</h1>
          <div className="text-muted">
            مؤشرات معتمدة دون {EARLY_WARNING_ACHIEVEMENT_THRESHOLD}% — {PERIOD_LABEL[period]} {year}
          </div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      {msg && (
        <div className="alert alert-warn" style={{ marginBottom: "1rem" }}>
          {msg}
        </div>
      )}

      <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
        {statCards.map((s) => (
          <div key={s.lbl} className={`card stat-card ${s.accent}`.trim()}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>توزيع المؤشرات حسب مستوى الخطر</h3>
        <DonutChart
          segments={donutSegments.map((s) => ({
            name: s.name,
            value: s.value,
            color: s.color,
          }))}
          centerLabel={summary.activeCount > 0 ? String(summary.activeCount) : "—"}
          centerSubLabel="مؤشر معرض"
        />
      </div>

      <div className="card alert alert-info" style={{ marginBottom: "1rem" }}>
        تُعرض المؤشرات ذات القياسات المعتمدة (APPROVED) للفترة الحالية عندما تكون نسبة الإنجاز أقل من{" "}
        {EARLY_WARNING_ACHIEVEMENT_THRESHOLD}% (أو المتحقق/المستهدف &lt; 0.85). مستوى الخطر: مرتفع عند فجوة
        ≥30، متوسط ≥15، ومنخفض فيما عدا ذلك (الفجوة = 100 − الإنجاز). إشعارات الكرون تبقى مسارًا خلفيًا
        منفصلًا.
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tmkeen-table">
          <thead>
            <tr>
              <th>الرمز</th>
              <th>المؤشر</th>
              <th>المستهدف</th>
              <th>المتحقق</th>
              <th>الإنجاز %</th>
              <th>الفجوة %</th>
              <th>مستوى الخطر</th>
              <th>بطاقة الانحراف</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.kpiId}>
                <td>
                  <span className="badge-primary">{r.code}</span>
                </td>
                <td>{r.name}</td>
                <td>{fmtNum(r.target)}</td>
                <td>{fmtNum(r.actual)}</td>
                <td>{fmtNum(r.achievementPct)}%</td>
                <td>{fmtNum(r.gapPct)}%</td>
                <td>
                  <span className={RISK_BADGE[r.riskLevel] || "badge-secondary"}>
                    {r.riskLabel}
                  </span>
                </td>
                <td>
                  {r.deviationCardId != null ? (
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      disabled={busyKpiId === r.deviationCardId || busyKpiId === r.kpiId}
                      onClick={() => openCard(r.deviationCardId!)}
                    >
                      بطاقة الانحراف
                    </button>
                  ) : canManage ? (
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      disabled={busyKpiId === r.kpiId}
                      onClick={() => generateCard(r.kpiId)}
                    >
                      توليد بطاقة
                    </button>
                  ) : (
                    <span className="text-muted" style={{ fontSize: ".78rem" }}>
                      لا توجد بطاقة
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-muted" style={{ padding: "1rem" }}>
            لا توجد مؤشرات معتمدة تحت عتبة الإنذار لهذه الفترة.
          </p>
        )}
      </div>

      {selectedCard && (
        <DeviationCardModal
          card={selectedCard}
          year={year}
          period={period}
          canManage={canManage}
          onClose={() => setSelectedCard(null)}
          onUpdated={refreshSelected}
        />
      )}
    </>
  );
}
