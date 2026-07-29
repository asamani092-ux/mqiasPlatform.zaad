"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PeriodSelector from "@/components/PeriodSelector";
import DonutChart from "@/components/charts/DonutChart";
import CompareBarChart from "@/components/charts/CompareBarChart";
import {
  complianceCompareBars,
  complianceDonutSegments,
  GOVERNANCE_STAT_LABELS,
  GOVERNANCE_STATUS_LABEL,
  type GovernanceStats,
} from "@/lib/governance-stats";
import { PERIOD_LABEL, type Period } from "@/lib/types";

type Requirement = {
  id: number;
  code: string;
  title: string;
  category: string | null;
  year: number;
  owner: string | null;
  status: string;
  compliancePct: number;
};

const STATUS_BADGE: Record<string, string> = {
  COMPLIANT: "badge-success",
  PARTIAL: "badge-warning",
  NON_COMPLIANT: "badge-danger",
  PENDING: "badge-secondary",
};

const STATUS_CYCLE: Record<string, string> = {
  PENDING: "COMPLIANT",
  COMPLIANT: "PARTIAL",
  PARTIAL: "NON_COMPLIANT",
  NON_COMPLIANT: "PENDING",
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
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showObservations, setShowObservations] = useState(false);

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

  async function cycleRequirementStatus(id: number, status: string) {
    const res = await fetch("/api/governance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "requirement",
        id,
        status: STATUS_CYCLE[status] ?? "PENDING",
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

  const categories = useMemo(
    () =>
      Array.from(
        new Set(requirements.map((r) => r.category).filter((c): c is string => Boolean(c)))
      ).sort(),
    [requirements]
  );

  const filtered = useMemo(
    () =>
      requirements.filter((r) => {
        if (statusFilter && r.status !== statusFilter) return false;
        if (categoryFilter && r.category !== categoryFilter) return false;
        return true;
      }),
    [requirements, statusFilter, categoryFilter]
  );

  const donutSegments = complianceDonutSegments(stats);
  const compareBars = complianceCompareBars(stats);
  const readinessPct = Math.min(100, Math.max(0, stats.compliancePct));

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار الحوكمة</h1>
          <div className="text-muted">
            درجة الجاهزية ومعايير الالتزام — {PERIOD_LABEL[period]} {year}
          </div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      {msg && (
        <div className="alert alert-warn" style={{ marginBottom: "1rem" }}>
          {msg}
        </div>
      )}

      <div className="card" style={{ marginBottom: "1rem", borderTop: "3px solid var(--color-primary, #8b1a2a)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".85rem" }}>
          <h2 style={{ margin: 0, fontSize: "1rem" }}>درجة جاهزية الحوكمة الكلية</h2>
          <span style={{ fontSize: "1.8rem", fontWeight: 800 }}>{readinessPct}%</span>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 99,
            background: "var(--color-border, #e5e5e5)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${readinessPct}%`,
              background: "var(--color-primary, #8b1a2a)",
              transition: "width 1.2s ease",
            }}
          />
        </div>
        <div className="grid grid-3" style={{ marginTop: "1.1rem", gap: "1rem" }}>
          <div className="card stat-card stat-card--success" style={{ margin: 0 }}>
            <div className="stat-num">{stats.compliantCount}</div>
            <div className="stat-lbl">{GOVERNANCE_STAT_LABELS.compliantCount}</div>
          </div>
          <div className="card stat-card stat-card--warning" style={{ margin: 0 }}>
            <div className="stat-num">{stats.partialCount}</div>
            <div className="stat-lbl">{GOVERNANCE_STAT_LABELS.partialCount}</div>
          </div>
          <div className="card stat-card stat-card--danger" style={{ margin: 0 }}>
            <div className="stat-num">{stats.notCompliantCount}</div>
            <div className="stat-lbl">{GOVERNANCE_STAT_LABELS.notCompliantCount}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <h3 style={{ marginBottom: ".75rem" }}>توزيع الالتزام</h3>
          <DonutChart
            segments={donutSegments}
            centerLabel={`${readinessPct}%`}
            centerSubLabel="الجاهزية"
          />
        </div>
        <div className="card">
          <h3 style={{ marginBottom: ".75rem" }}>مستوفى مقابل غير مستوفى</h3>
          <CompareBarChart items={compareBars} />
        </div>
      </div>

      <div style={{ display: "flex", gap: ".65rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        <select
          className="inp"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ width: "auto" }}
        >
          <option value="">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="inp"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: "auto" }}
        >
          <option value="">كل الحالات</option>
          <option value="COMPLIANT">ملتزم</option>
          <option value="PARTIAL">جزئي</option>
          <option value="NON_COMPLIANT">غير ملتزم</option>
          <option value="PENDING">انتظار</option>
        </select>
        <button type="button" className="btn btn-ghost" onClick={() => load()}>
          تحديث
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowObservations((v) => !v)}
        >
          {showObservations ? "إخفاء الملاحظات" : "الملاحظات (ثانوي)"}
        </button>
      </div>

      <div className="card" style={{ marginBottom: "1rem", padding: 0, overflow: "hidden" }}>
        <table className="tmkeen-table">
          <thead>
            <tr>
              <th>الرمز</th>
              <th>المعيار</th>
              <th>التصنيف</th>
              <th>الجهة</th>
              <th>نسبة الالتزام</th>
              <th>الحالة</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.code}</td>
                <td>{r.title}</td>
                <td>{r.category || "—"}</td>
                <td>{r.owner || "—"}</td>
                <td>{r.compliancePct}%</td>
                <td>
                  <span className={STATUS_BADGE[r.status] ?? "badge-secondary"}>
                    {GOVERNANCE_STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </td>
                <td>
                  {canManage ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => cycleRequirementStatus(r.id, r.status)}
                    >
                      تغيير الحالة
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-muted" style={{ padding: ".75rem 1rem" }}>
            لا توجد معايير مطابقة للفلتر.
          </p>
        )}
      </div>

      {showObservations && (
        <div className="card">
          <h3 style={{ marginBottom: ".75rem" }}>الملاحظات (قسم ثانوي)</h3>
          <p className="text-muted" style={{ marginBottom: ".75rem", fontSize: ".85rem" }}>
            مفتوحة: {stats.openObservations} · مغلقة خلال الفترة: {stats.closedInPeriod}
          </p>
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
