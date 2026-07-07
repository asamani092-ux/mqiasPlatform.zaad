"use client";

import { useCallback, useEffect, useState } from "react";
import PeriodSelector from "@/components/PeriodSelector";
import DonutChart from "@/components/charts/DonutChart";
import CompareBarChart from "@/components/charts/CompareBarChart";
import {
  complianceCompareBars,
  complianceDonutSegments,
  GOVERNANCE_STAT_LABELS,
  type GovernanceStats,
} from "@/lib/governance-stats";
import { PERIOD_LABEL, type Period } from "@/lib/types";

type Requirement = {
  id: number;
  title: string;
  category: string | null;
  year: number;
  status: string;
};

type Observation = {
  id: number;
  title: string;
  status: string;
  openedYear: number;
  openedPeriod: string;
  closedYear: number | null;
  closedPeriod: string | null;
};

function formatPeriod(year: number | null, p: string | null) {
  if (!year || !p) return "—";
  return `${year} · ${PERIOD_LABEL[p as Period] || p}`;
}

export default function GovernanceClient({
  initialStats,
  initialRequirements,
  initialObservations,
  year,
  period,
  canManage,
}: {
  initialStats: GovernanceStats;
  initialRequirements: Requirement[];
  initialObservations: Observation[];
  year: number;
  period: Period;
  canManage: boolean;
}) {
  const [stats, setStats] = useState(initialStats);
  const [requirements, setRequirements] = useState(initialRequirements);
  const [observations, setObservations] = useState(initialObservations);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"requirements" | "observations">("requirements");

  const load = useCallback(async () => {
    const res = await fetch(`/api/governance?year=${year}&period=${period}`);
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setRequirements(data.requirements);
      setObservations(data.observations);
    }
  }, [year, period]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleRequirement(id: number, status: string) {
    const res = await fetch("/api/governance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "requirement",
        id,
        status: status === "APPLIED" ? "NOT_APPLIED" : "APPLIED",
      }),
    });
    if (res.ok) await load();
    else {
      const d = await res.json();
      setMsg(d.error || "فشل التحديث");
    }
  }

  async function toggleObservation(id: number, status: string) {
    const res = await fetch("/api/governance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "observation",
        id,
        status: status === "OPEN" ? "CLOSED" : "OPEN",
        closedYear: status === "OPEN" ? year : null,
        closedPeriod: status === "OPEN" ? period : null,
      }),
    });
    if (res.ok) await load();
    else {
      const d = await res.json();
      setMsg(d.error || "فشل التحديث");
    }
  }

  const statCards = [
    { num: stats.totalRequirements, lbl: GOVERNANCE_STAT_LABELS.totalRequirements, accent: "" },
    { num: stats.appliedCount, lbl: GOVERNANCE_STAT_LABELS.appliedCount, accent: "stat-card--success" },
    { num: `${stats.compliancePct}%`, lbl: GOVERNANCE_STAT_LABELS.compliancePct, accent: "stat-card--secondary" },
    { num: stats.notAppliedCount, lbl: GOVERNANCE_STAT_LABELS.notAppliedCount, accent: "stat-card--warning" },
    { num: stats.openObservations, lbl: GOVERNANCE_STAT_LABELS.openObservations, accent: "stat-card--danger" },
    { num: stats.closedInPeriod, lbl: GOVERNANCE_STAT_LABELS.closedInPeriod, accent: "stat-card--warning" },
  ];

  const donutSegments = complianceDonutSegments(stats);
  const compareBars = complianceCompareBars(stats);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار الحوكمة</h1>
          <div className="text-muted">متطلبات الامتثال والملاحظات — {PERIOD_LABEL[period]} {year}</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      {msg && (
        <div className="alert alert-warn" style={{ marginBottom: "1rem" }}>
          {msg}
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: "1rem" }}>
        {statCards.map((s) => (
          <div key={s.lbl} className={`card stat-card ${s.accent}`.trim()}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <h3 style={{ marginBottom: ".75rem" }}>نسبة الامتثال</h3>
          <DonutChart
            segments={donutSegments}
            centerLabel={`${stats.compliancePct}%`}
            centerSubLabel="نسبة الامتثال"
          />
        </div>
        <div className="card">
          <h3 style={{ marginBottom: ".75rem" }}>المطبّق مقابل غير المطبّق</h3>
          <CompareBarChart items={compareBars} />
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className={tab === "requirements" ? "active" : ""}
          onClick={() => setTab("requirements")}
        >
          المتطلبات
        </button>
        <button
          type="button"
          className={tab === "observations" ? "active" : ""}
          onClick={() => setTab("observations")}
        >
          الملاحظات
        </button>
      </div>

      {tab === "requirements" && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: ".75rem" }}>متطلبات الامتثال — {year}</h3>
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>التصنيف</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.category || "—"}</td>
                  <td>
                    {canManage ? (
                      <button
                        type="button"
                        className={r.status === "APPLIED" ? "badge-success" : "badge-danger"}
                        onClick={() => toggleRequirement(r.id, r.status)}
                      >
                        {r.status === "APPLIED" ? "مطبّق" : "غير مطبّق"}
                      </button>
                    ) : (
                      <span className={r.status === "APPLIED" ? "badge-success" : "badge-danger"}>
                        {r.status === "APPLIED" ? "مطبّق" : "غير مطبّق"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {requirements.length === 0 && (
            <p className="text-muted" style={{ paddingTop: ".75rem" }}>
              لا توجد متطلبات لهذا العام.
            </p>
          )}
        </div>
      )}

      {tab === "observations" && (
        <div className="card">
          <h3 style={{ marginBottom: ".75rem" }}>الملاحظات</h3>
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>الحالة</th>
                <th>فترة الفتح</th>
                <th>فترة الإغلاق</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((o) => (
                <tr key={o.id}>
                  <td>{o.title}</td>
                  <td>
                    {canManage ? (
                      <button
                        type="button"
                        className={o.status === "OPEN" ? "badge-warning" : "badge-success"}
                        onClick={() => toggleObservation(o.id, o.status)}
                      >
                        {o.status === "OPEN" ? "قائمة" : "مغلقة"}
                      </button>
                    ) : (
                      <span className={o.status === "OPEN" ? "badge-warning" : "badge-success"}>
                        {o.status === "OPEN" ? "قائمة" : "مغلقة"}
                      </span>
                    )}
                  </td>
                  <td>{formatPeriod(o.openedYear, o.openedPeriod)}</td>
                  <td>{formatPeriod(o.closedYear, o.closedPeriod)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {observations.length === 0 && (
            <p className="text-muted" style={{ paddingTop: ".75rem" }}>
              لا توجد ملاحظات مسجّلة.
            </p>
          )}
        </div>
      )}
    </>
  );
}
