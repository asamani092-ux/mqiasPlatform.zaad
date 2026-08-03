"use client";

import { useEffect, useState } from "react";
import { Download, Plus, Trash2, X } from "lucide-react";
import {
  ACTION_STATUS_BADGE,
  ACTION_STATUS_LABEL,
  CARD_STATUS_BADGE,
  CARD_STATUS_LABEL,
} from "@/lib/deviation-stats";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";

export type DeviationCardDetail = {
  id: number;
  kpiId: number;
  year: number;
  period: string;
  targetValue: number;
  actualValue: number;
  deviationPct: number;
  reasons: string;
  status: string;
  kpi: { code: string; name: string; unit: string };
  actions: {
    id: number;
    description: string;
    responsibleName: string | null;
    responsible: { name: string } | null;
    dueDate: string;
    status: string;
  }[];
};

export default function DeviationCardModal({
  card,
  year,
  period,
  canManage,
  onClose,
  onUpdated,
}: {
  card: DeviationCardDetail;
  year: number;
  period: Period;
  canManage: boolean;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [editReasons, setEditReasons] = useState(card.reasons);
  const [newAction, setNewAction] = useState({ description: "", responsibleName: "", dueDate: "" });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditReasons(card.reasons);
  }, [card]);

  async function updateCard(status?: string, forceClose = false) {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/deviation/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reasons: editReasons, forceClose }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("تم التحديث");
        await onUpdated();
      } else {
        setMsg(data.error || "فشل التحديث");
      }
    } finally {
      setSaving(false);
    }
  }

  async function addAction() {
    if (!newAction.description.trim() || !newAction.dueDate) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/deviation/${card.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAction),
      });
      if (res.ok) {
        setNewAction({ description: "", responsibleName: "", dueDate: "" });
        await onUpdated();
      } else {
        const data = await res.json();
        setMsg(data.error || "فشل إضافة الإجراء");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteAction(actionId: number) {
    if (!window.confirm("حذف هذا الإجراء التصحيحي؟")) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/deviation/${card.id}/actions/${actionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await onUpdated();
      } else {
        const data = await res.json();
        setMsg(data.error || "فشل حذف الإجراء");
      }
    } finally {
      setSaving(false);
    }
  }

  async function updateAction(actionId: number, status: string) {
    setSaving(true);
    try {
      await fetch(`/api/deviation/${card.id}/actions/${actionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await onUpdated();
    } finally {
      setSaving(false);
    }
  }

  function exportPdf() {
    const prevTitle = document.title;
    document.title = `${card.kpi.name} — بطاقة انحراف`;
    window.print();
    document.title = prevTitle;
  }

  async function closeCard() {
    const hasOpenActions = card.actions.some((a) => a.status !== "DONE");
    if (
      hasOpenActions &&
      !window.confirm("توجد إجراءات تصحيحية غير مكتملة. هل تريد إقفال البطاقة رغم ذلك؟")
    ) {
      return;
    }
    await updateCard("CLOSED", hasOpenActions);
  }

  return (
    <div className="modal-overlay no-print-overlay" onClick={onClose}>
      <div
        className="modal-panel card wide print-modal printable-region deviation-card-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head no-print">
          <div>
            <h3 style={{ marginBottom: ".25rem" }}>{card.kpi.name}</h3>
            <div className="text-muted">
              {card.kpi.code} · {PERIOD_LABEL[period]} {year}
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <X {...ICON_PROPS} />
          </button>
        </div>

        <div className="modal-body">
          {msg && <div className="alert alert-warn" style={{ marginBottom: "1rem" }}>{msg}</div>}

          <div className="field-grid" style={{ marginBottom: "1rem" }}>
            <div className="field-cell">
              <div className="field-cell-label">المستهدف</div>
              <div className="field-cell-value">
                {card.targetValue} {card.kpi.unit}
              </div>
            </div>
            <div className="field-cell">
              <div className="field-cell-label">المتحقق</div>
              <div className="field-cell-value">{card.actualValue}</div>
            </div>
            <div className="field-cell">
              <div className="field-cell-label">نسبة الانحراف</div>
              <div className="field-cell-value">{card.deviationPct}%</div>
            </div>
            <div className="field-cell field-cell-control">
              <div className="field-cell-label">الأسباب</div>
              {canManage ? (
                <textarea
                  className="input-field"
                  rows={3}
                  value={editReasons}
                  onChange={(e) => setEditReasons(e.target.value)}
                  disabled={saving}
                />
              ) : (
                <div className="field-cell-value">{card.reasons}</div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <span className={CARD_STATUS_BADGE[card.status] || "badge-secondary"}>
              {CARD_STATUS_LABEL[card.status] || card.status}
            </span>
          </div>

          <h4 className="section-h">الإجراءات التصحيحية</h4>
          <table className="tmkeen-table" style={{ marginBottom: "1rem" }}>
            <thead>
              <tr>
                <th>الإجراء</th>
                <th>المسؤول</th>
                <th>الإطار الزمني</th>
                <th>{canManage ? "الحالة / إجراء" : "الحالة"}</th>
              </tr>
            </thead>
            <tbody>
              {card.actions.map((a) => (
                <tr key={a.id}>
                  <td>{a.description}</td>
                  <td>{a.responsible?.name || a.responsibleName || "—"}</td>
                  <td>{new Date(a.dueDate).toLocaleDateString("ar-SA")}</td>
                  <td>
                    {canManage ? (
                      <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", alignItems: "center" }}>
                        <select
                          className="input-field"
                          style={{ width: "auto", fontSize: ".75rem" }}
                          value={a.status}
                          disabled={saving}
                          onChange={(e) => updateAction(a.id, e.target.value)}
                        >
                          {Object.entries(ACTION_STATUS_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="icon-btn"
                          disabled={saving}
                          onClick={() => deleteAction(a.id)}
                          aria-label="حذف الإجراء"
                          title="حذف الإجراء"
                        >
                          <Trash2 {...ICON_PROPS} />
                        </button>
                      </div>
                    ) : (
                      <span className={ACTION_STATUS_BADGE[a.status] || "badge-secondary"}>
                        {ACTION_STATUS_LABEL[a.status] || a.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {canManage && (
                <tr className="no-print">
                  <td>
                    <input
                      className="input-field"
                      placeholder="وصف الإجراء"
                      value={newAction.description}
                      disabled={saving}
                      onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="input-field"
                      placeholder="المسؤول"
                      value={newAction.responsibleName}
                      disabled={saving}
                      onChange={(e) => setNewAction({ ...newAction, responsibleName: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="input-field"
                      type="date"
                      value={newAction.dueDate}
                      disabled={saving}
                      onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      disabled={saving || !newAction.description.trim() || !newAction.dueDate}
                      onClick={addAction}
                    >
                      <Plus {...ICON_PROPS} />
                      إضافة
                    </button>
                  </td>
                </tr>
              )}
              {!canManage && card.actions.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-muted">
                    لا توجد إجراءات تصحيحية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-footer no-print" style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", alignItems: "center" }}>
          <div style={{ flex: "1 1 160px", display: "flex", justifyContent: "flex-start" }}>
            {canManage && (
              <button
                type="button"
                className="btn-primary btn-sm"
                disabled={saving}
                onClick={() => updateCard()}
              >
                حفظ كمسودة
              </button>
            )}
          </div>
          <div style={{ flex: "1 1 180px", display: "flex", justifyContent: "center" }}>
            {canManage && card.status !== "CLOSED" && (
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  style={{ fontSize: ".9rem", padding: ".55rem 1rem" }}
                  disabled={saving}
                  onClick={closeCard}
                >
                  إقفال البطاقة
                </button>
            )}
          </div>
          <div style={{ flex: "1 1 160px", display: "flex", justifyContent: "flex-end" }}>
            <button type="button" className="btn-primary btn-sm" disabled={saving} onClick={exportPdf}>
              <Download {...ICON_PROPS} />
              تصدير PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
