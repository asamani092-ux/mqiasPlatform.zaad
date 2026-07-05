"use client";

import { useCallback, useEffect, useState } from "react";
import PeriodSelector from "@/components/PeriodSelector";
import { PERIOD_LABEL, type Period } from "@/lib/types";

type Stats = {
  totalRequirements: number;
  appliedCount: number;
  compliancePct: number;
  notAppliedCount: number;
  openObservations: number;
  closedInPeriod: number;
};

type Requirement = {
  id: number;
  title: string;
  category: string | null;
  year: number;
  status: string;
  notes: string | null;
};

type Observation = {
  id: number;
  title: string;
  status: string;
  openedYear: number;
  openedPeriod: string;
  closedYear: number | null;
  closedPeriod: string | null;
  closedAt: string | null;
};

export default function GovernanceClient({
  initialStats,
  initialRequirements,
  initialObservations,
  year,
  period,
  canManage,
}: {
  initialStats: Stats;
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
  const [newReq, setNewReq] = useState({ title: "", category: "" });
  const [newObs, setNewObs] = useState({ title: "" });

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
      body: JSON.stringify({ type: "requirement", id, status }),
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
        status,
        closedYear: status === "CLOSED" ? year : null,
        closedPeriod: status === "CLOSED" ? period : null,
      }),
    });
    if (res.ok) await load();
  }

  async function addRequirement() {
    if (!newReq.title.trim()) return;
    const res = await fetch("/api/governance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "requirement", title: newReq.title, category: newReq.category || null, year }),
    });
    if (res.ok) {
      setNewReq({ title: "", category: "" });
      await load();
    }
  }

  async function addObservation() {
    if (!newObs.title.trim()) return;
    const res = await fetch("/api/governance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "observation", title: newObs.title, openedYear: year, openedPeriod: period }),
    });
    if (res.ok) {
      setNewObs({ title: "" });
      await load();
    }
  }

  const statCards = [
    { num: stats.totalRequirements, lbl: "المتطلبات المعتمدة", color: "var(--maroon)" },
    { num: stats.appliedCount, lbl: "المطبقة", color: "var(--green)" },
    { num: `${stats.compliancePct}%`, lbl: "نسبة الامتثال", color: "var(--gold)" },
    { num: stats.notAppliedCount, lbl: "غير المكتملة", color: "var(--orange)" },
    { num: stats.openObservations, lbl: "ملاحظات قائمة", color: "var(--red)" },
    { num: stats.closedInPeriod, lbl: "ملاحظات مغلقة بالفترة", color: "var(--amber)" },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار الحوكمة</h1>
          <div className="sub">متطلبات الامتثال والملاحظات</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      {msg && <div className="alert alert-warn" style={{ marginBottom: "1rem" }}>{msg}</div>}

      <div className="grid grid-3" style={{ marginBottom: "1rem" }}>
        {statCards.map((s) => (
          <div key={s.lbl} className="card stat" style={{ borderRightColor: s.color }}>
            <div className="num">{s.num}</div>
            <div className="lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>متطلبات الامتثال — {year}</h3>
        <table className="tbl">
          <thead><tr><th>المتطلب</th><th>التصنيف</th><th>الحالة</th><th>ملاحظات</th></tr></thead>
          <tbody>
            {requirements.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.category || "—"}</td>
                <td>
                  {canManage ? (
                    <button
                      type="button"
                      className={`badge ${r.status === "APPLIED" ? "achieved" : "critical"}`}
                      onClick={() => toggleRequirement(r.id, r.status === "APPLIED" ? "NOT_APPLIED" : "APPLIED")}
                    >
                      {r.status === "APPLIED" ? "مطبّق" : "غير مطبّق"}
                    </button>
                  ) : (
                    <span className={`badge ${r.status === "APPLIED" ? "achieved" : "critical"}`}>
                      {r.status === "APPLIED" ? "مطبّق" : "غير مطبّق"}
                    </span>
                  )}
                </td>
                <td>{r.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {canManage && (
          <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem" }}>
            <input className="inp" placeholder="متطلب جديد" value={newReq.title} onChange={(e) => setNewReq({ ...newReq, title: e.target.value })} />
            <input className="inp" placeholder="التصنيف" value={newReq.category} onChange={(e) => setNewReq({ ...newReq, category: e.target.value })} />
            <button type="button" className="btn btn-sm" onClick={addRequirement}>إضافة</button>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: ".75rem" }}>الملاحظات</h3>
        <table className="tbl">
          <thead><tr><th>الملاحظة</th><th>فترة الفتح</th><th>الحالة</th><th>إغلاق</th></tr></thead>
          <tbody>
            {observations.map((o) => (
              <tr key={o.id}>
                <td>{o.title}</td>
                <td>{o.openedYear} · {PERIOD_LABEL[o.openedPeriod as Period] || o.openedPeriod}</td>
                <td><span className={`badge ${o.status === "OPEN" ? "atrisk" : "achieved"}`}>{o.status === "OPEN" ? "قائمة" : "مغلقة"}</span></td>
                <td>
                  {canManage && (
                    <button
                      type="button"
                      className="btn-sm btn-ghost"
                      onClick={() => toggleObservation(o.id, o.status === "OPEN" ? "CLOSED" : "OPEN")}
                    >
                      {o.status === "OPEN" ? "إغلاق" : "إعادة فتح"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {canManage && (
          <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem" }}>
            <input className="inp" placeholder="ملاحظة جديدة" value={newObs.title} onChange={(e) => setNewObs({ title: e.target.value })} />
            <button type="button" className="btn btn-sm" onClick={addObservation}>إضافة</button>
          </div>
        )}
      </div>
    </>
  );
}
