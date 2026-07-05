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
  const [newReq, setNewReq] = useState({ title: "", category: "", notes: "" });
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

  async function updateRequirement(id: number, patch: { notes?: string | null; title?: string; category?: string | null }) {
    const res = await fetch("/api/governance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "requirement", id, ...patch }),
    });
    if (res.ok) {
      setMsg("تم حفظ التعديل");
      await load();
    } else {
      const d = await res.json();
      setMsg(d.error || "فشل الحفظ");
    }
  }

  async function updateObservation(id: number, title: string) {
    const res = await fetch("/api/governance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "observation", id, title }),
    });
    if (res.ok) {
      setMsg("تم حفظ الملاحظة");
      await load();
    } else {
      const d = await res.json();
      setMsg(d.error || "فشل الحفظ");
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
      body: JSON.stringify({
        type: "requirement",
        title: newReq.title,
        category: newReq.category || null,
        notes: newReq.notes || null,
        year,
      }),
    });
    if (res.ok) {
      setNewReq({ title: "", category: "", notes: "" });
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
    { num: stats.totalRequirements, lbl: "المتطلبات المعتمدة", color: "var(--tmkeen-primary)" },
    { num: stats.appliedCount, lbl: "المطبقة", color: "var(--tmkeen-success)" },
    { num: `${stats.compliancePct}%`, lbl: "نسبة الامتثال", color: "var(--tmkeen-secondary)" },
    { num: stats.notAppliedCount, lbl: "غير المكتملة", color: "var(--tmkeen-warning)" },
    { num: stats.openObservations, lbl: "ملاحظات قائمة", color: "var(--tmkeen-danger)" },
    { num: stats.closedInPeriod, lbl: "ملاحظات مغلقة بالفترة", color: "var(--tmkeen-warning)" },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار الحوكمة</h1>
          <div className="text-muted">متطلبات الامتثال والملاحظات</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      {msg && <div className="alert alert-warn" style={{ marginBottom: "1rem" }}>{msg}</div>}

      <div className="grid grid-3" style={{ marginBottom: "1rem" }}>
        {statCards.map((s) => (
          <div key={s.lbl} className="card stat-card" style={{ borderRightColor: s.color }}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>متطلبات الامتثال — {year}</h3>
        <table className="tmkeen-table">
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
                      className={r.status === "APPLIED" ? "badge-success" : "badge-danger"}
                      onClick={() => toggleRequirement(r.id, r.status === "APPLIED" ? "NOT_APPLIED" : "APPLIED")}
                    >
                      {r.status === "APPLIED" ? "مطبّق" : "غير مطبّق"}
                    </button>
                  ) : (
                    <span className={r.status === "APPLIED" ? "badge-success" : "badge-danger"}>
                      {r.status === "APPLIED" ? "مطبّق" : "غير مطبّق"}
                    </span>
                  )}
                </td>
                <td>
                  {canManage ? (
                    <input
                      className="input-field"
                      style={{ fontSize: ".78rem", minWidth: "140px" }}
                      defaultValue={r.notes || ""}
                      placeholder="أضف ملاحظة..."
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (r.notes || "")) updateRequirement(r.id, { notes: v || null });
                      }}
                    />
                  ) : (
                    r.notes || "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {canManage && (
          <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
            <input className="input-field" placeholder="متطلب جديد" value={newReq.title} onChange={(e) => setNewReq({ ...newReq, title: e.target.value })} />
            <input className="input-field" placeholder="التصنيف" value={newReq.category} onChange={(e) => setNewReq({ ...newReq, category: e.target.value })} />
            <input className="input-field" placeholder="ملاحظات" value={newReq.notes} onChange={(e) => setNewReq({ ...newReq, notes: e.target.value })} />
            <button type="button" className="btn-primary btn-sm" onClick={addRequirement}>إضافة</button>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: ".75rem" }}>الملاحظات</h3>
        <table className="tmkeen-table">
          <thead><tr><th>الملاحظة</th><th>فترة الفتح</th><th>الحالة</th><th>إغلاق</th></tr></thead>
          <tbody>
            {observations.map((o) => (
              <tr key={o.id}>
                <td>
                  {canManage ? (
                    <input
                      className="input-field"
                      style={{ fontSize: ".78rem", minWidth: "180px" }}
                      defaultValue={o.title}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== o.title) updateObservation(o.id, v);
                      }}
                    />
                  ) : (
                    o.title
                  )}
                </td>
                <td>{o.openedYear} · {PERIOD_LABEL[o.openedPeriod as Period] || o.openedPeriod}</td>
                <td><span className={o.status === "OPEN" ? "badge-warning" : "badge-success"}>{o.status === "OPEN" ? "قائمة" : "مغلقة"}</span></td>
                <td>
                  {canManage && (
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
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
            <input className="input-field" placeholder="ملاحظة جديدة" value={newObs.title} onChange={(e) => setNewObs({ title: e.target.value })} />
            <button type="button" className="btn-primary btn-sm" onClick={addObservation}>إضافة</button>
          </div>
        )}
      </div>
    </>
  );
}
