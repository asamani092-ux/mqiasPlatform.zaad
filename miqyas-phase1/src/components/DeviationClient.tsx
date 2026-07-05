"use client";

import { useCallback, useEffect, useState } from "react";
import PeriodSelector from "@/components/PeriodSelector";
import KpiDetailDrawer from "@/components/KpiDetailDrawer";
import { PERIOD_LABEL, type Period } from "@/lib/types";

type Card = {
  id: number;
  kpiId: number;
  year: number;
  period: string;
  targetValue: number;
  actualValue: number;
  deviationPct: number;
  reasons: string;
  status: string;
  closedAt: string | null;
  kpi: { code: string; name: string; unit: string };
  actions: {
    id: number;
    description: string;
    responsibleName: string | null;
    responsible: { name: string } | null;
    dueDate: string;
    status: string;
    completedAt: string | null;
  }[];
};

const CARD_BADGE: Record<string, string> = {
  OPEN: "badge-warning",
  IN_PROGRESS: "badge-warning",
  CLOSED: "badge-success",
};

const CARD_LABEL: Record<string, string> = {
  OPEN: "مفتوحة",
  IN_PROGRESS: "قيد المعالجة",
  CLOSED: "مغلقة",
};

const ACTION_LABEL: Record<string, string> = {
  PENDING: "معلق",
  IN_PROGRESS: "جاري",
  DONE: "منجز",
  LATE: "متأخر",
};

export default function DeviationClient({
  initialCards,
  year,
  period,
  canManage,
  isAdmin,
}: {
  initialCards: Card[];
  year: number;
  period: Period;
  canManage: boolean;
  isAdmin: boolean;
}) {
  const [cards, setCards] = useState(initialCards);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [drawerKpiId, setDrawerKpiId] = useState<number | null>(null);
  const [editReasons, setEditReasons] = useState("");
  const [newAction, setNewAction] = useState({ description: "", responsibleName: "", dueDate: "" });

  const selected = cards.find((c) => c.id === selectedId) ?? null;

  const load = useCallback(async () => {
    const q = new URLSearchParams({ year: String(year), period });
    if (statusFilter) q.set("status", statusFilter);
    const res = await fetch(`/api/deviation?${q}`);
    if (res.ok) {
      const data = await res.json();
      setCards(data.cards);
    }
  }, [year, period, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selected) setEditReasons(selected.reasons);
  }, [selected]);

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

  async function updateCard(status?: string) {
    if (!selected) return;
    const res = await fetch(`/api/deviation/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reasons: editReasons }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("تم التحديث");
      await load();
      setSelectedId(data.card.id);
    } else {
      setMsg(data.error || "فشل التحديث");
    }
  }

  async function addAction() {
    if (!selected || !newAction.description.trim()) return;
    const res = await fetch(`/api/deviation/${selected.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAction),
    });
    if (res.ok) {
      setNewAction({ description: "", responsibleName: "", dueDate: "" });
      await load();
    } else {
      const data = await res.json();
      setMsg(data.error || "فشل إضافة الإجراء");
    }
  }

  async function updateAction(actionId: number, status: string) {
    if (!selected) return;
    await fetch(`/api/deviation/${selected.id}/actions/${actionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>بطاقات انحراف المؤشرات</h1>
          <div className="text-muted">توثيق الانحرافات وإجراءات المعالجة</div>
        </div>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
          <PeriodSelector year={year} period={period} />
          {isAdmin && (
            <button type="button" className="btn-primary btn-sm" onClick={generateCards}>
              توليد البطاقات
            </button>
          )}
        </div>
      </div>

      {msg && <div className="alert alert-info" style={{ marginBottom: "1rem" }}>{msg}</div>}

      <div style={{ display: "flex", gap: "1rem" }}>
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: ".5rem", marginBottom: ".75rem" }}>
            <select className="input-field" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">كل الحالات</option>
              <option value="OPEN">مفتوحة</option>
              <option value="IN_PROGRESS">قيد المعالجة</option>
              <option value="CLOSED">مغلقة</option>
            </select>
          </div>
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>المؤشر</th><th>المستهدف</th><th>المتحقق</th><th>الانحراف %</th><th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr
                  key={c.id}
                  style={{ cursor: "pointer", background: selectedId === c.id ? "var(--cream)" : undefined }}
                  onClick={() => setSelectedId(c.id)}
                >
                  <td>{c.kpi.name}</td>
                  <td>{c.targetValue}</td>
                  <td>{c.actualValue}</td>
                  <td>{c.deviationPct}%</td>
                  <td><span className={CARD_BADGE[c.status]}>{CARD_LABEL[c.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {cards.length === 0 && <p className="text-muted">لا توجد بطاقات لهذه الفترة.</p>}
        </div>

        {selected && (
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: ".75rem" }}>{selected.kpi.name}</h3>
            <p className="text-muted">{selected.kpi.code} · {PERIOD_LABEL[period]}</p>
            <div style={{ fontSize: ".82rem", marginBottom: "1rem" }}>
              <div>المستهدف: {selected.targetValue} {selected.kpi.unit}</div>
              <div>المتحقق: {selected.actualValue}</div>
              <div>نسبة الانحراف: {selected.deviationPct}%</div>
              <button type="button" className="btn-secondary btn-sm" style={{ marginTop: ".5rem" }} onClick={() => setDrawerKpiId(selected.kpiId)}>
                تفاصيل المؤشر
              </button>
            </div>
            <label className="label-field">أسباب الانحراف</label>
            {canManage ? (
              <textarea className="input-field" rows={3} value={editReasons} onChange={(e) => setEditReasons(e.target.value)} />
            ) : (
              <p>{selected.reasons}</p>
            )}
            {canManage && (
              <div style={{ display: "flex", gap: ".5rem", margin: ".75rem 0" }}>
                <button type="button" className="btn-primary btn-sm" onClick={() => updateCard()}>حفظ الأسباب</button>
                {selected.status !== "IN_PROGRESS" && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => updateCard("IN_PROGRESS")}>بدء المعالجة</button>
                )}
                {selected.status !== "CLOSED" && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => updateCard("CLOSED")}>إغلاق البطاقة</button>
                )}
              </div>
            )}
            <h4>الإجراءات التصحيحية</h4>
            <table className="tmkeen-table" style={{ marginBottom: "1rem" }}>
              <thead>
                <tr><th>الإجراء</th><th>المسؤول</th><th>الإطار الزمني</th><th>الحالة</th></tr>
              </thead>
              <tbody>
                {selected.actions.map((a) => (
                  <tr key={a.id}>
                    <td>{a.description}</td>
                    <td>{a.responsible?.name || a.responsibleName || "—"}</td>
                    <td>{new Date(a.dueDate).toLocaleDateString("ar-SA")}</td>
                    <td>
                      {canManage ? (
                        <select className="input-field" style={{ width: "auto", fontSize: ".75rem" }} value={a.status} onChange={(e) => updateAction(a.id, e.target.value)}>
                          {Object.entries(ACTION_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      ) : (
                        ACTION_LABEL[a.status] || a.status
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {canManage && (
              <div style={{ display: "grid", gap: ".5rem" }}>
                <input className="input-field" placeholder="وصف الإجراء" value={newAction.description} onChange={(e) => setNewAction({ ...newAction, description: e.target.value })} />
                <input className="input-field" placeholder="المسؤول" value={newAction.responsibleName} onChange={(e) => setNewAction({ ...newAction, responsibleName: e.target.value })} />
                <input className="input-field" type="date" value={newAction.dueDate} onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })} />
                <button type="button" className="btn-primary btn-sm" onClick={addAction}>إضافة إجراء</button>
              </div>
            )}
          </div>
        )}
      </div>

      <KpiDetailDrawer kpiId={drawerKpiId} year={year} period={period} onClose={() => setDrawerKpiId(null)} />
    </>
  );
}
