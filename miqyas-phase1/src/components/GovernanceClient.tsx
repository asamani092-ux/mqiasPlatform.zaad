"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import DonutChart from "@/components/charts/DonutChart";
import { TrackTitleRow } from "@/components/ui/TrackHelpButton";
import {
  complianceDonutSegments,
  GOVERNANCE_STAT_LABELS,
  GOVERNANCE_STATUS_LABEL,
  type GovernanceStats,
} from "@/lib/governance-stats";
import { GOVERNANCE_HELP } from "@/lib/track-help";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import { ICON_PROPS } from "@/lib/icon-props";

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

type Observation = {
  id: number;
  title: string;
  status: string;
  openedYear: number;
  openedPeriod: string;
  closedYear: number | null;
  closedPeriod: string | null;
  createdAt: string;
};

const STATUS_BADGE: Record<string, string> = {
  COMPLIANT: "badge-success",
  PARTIAL: "badge-warning",
  NON_COMPLIANT: "badge-danger",
  PENDING: "badge-secondary",
};

const OBS_STATUS_BADGE: Record<string, string> = {
  OPEN: "badge-warning",
  CLOSED: "badge-success",
};

const OBS_STATUS_LABEL: Record<string, string> = {
  OPEN: "مفتوحة",
  CLOSED: "مغلقة",
};

type RequirementForm = {
  code: string;
  title: string;
  category: string;
  owner: string;
  compliancePct: string;
  status: "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT" | "PENDING";
};

const emptyForm = (): RequirementForm => ({
  code: "",
  title: "",
  category: "",
  owner: "",
  compliancePct: "0",
  status: "PENDING",
});

export default function GovernanceClient({
  initialStats,
  initialRequirements,
  initialObservations = [],
  year,
  period,
  canManage,
}: {
  initialStats: GovernanceStats;
  initialRequirements: Requirement[];
  initialObservations?: Observation[];
  year: number;
  period: Period;
  canManage: boolean;
}) {
  const [stats, setStats] = useState(initialStats);
  const [requirements, setRequirements] = useState(initialRequirements);
  const [observations, setObservations] = useState(initialObservations);
  const [tab, setTab] = useState<"requirements" | "observations">("requirements");
  const [msg, setMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RequirementForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/governance?year=${year}&period=${period}`);
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setRequirements(data.requirements);
      setObservations(data.observations ?? []);
    }
  }, [year, period]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
    setMsg("");
  }

  function openEdit(r: Requirement) {
    setEditingId(r.id);
    setForm({
      code: r.code,
      title: r.title,
      category: r.category ?? "",
      owner: r.owner ?? "",
      compliancePct: String(r.compliancePct),
      status: r.status as RequirementForm["status"],
    });
    setModalOpen(true);
    setMsg("");
  }

  async function saveRequirement() {
    if (!form.code.trim() || !form.title.trim()) {
      setMsg("الرمز والعنوان مطلوبان");
      return;
    }
    const compliancePct = Math.min(100, Math.max(0, parseFloat(form.compliancePct) || 0));
    setSaving(true);
    setMsg("");
    try {
      const payload = {
        type: "requirement" as const,
        code: form.code.trim(),
        title: form.title.trim(),
        category: form.category.trim() || null,
        owner: form.owner.trim() || null,
        compliancePct,
        status: form.status,
      };

      const res = await fetch("/api/governance", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? { id: editingId, ...payload }
            : { ...payload, year }
        ),
      });

      if (res.ok) {
        setModalOpen(false);
        await load();
      } else {
        const d = await res.json();
        setMsg(d.error || "فشل الحفظ");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteRequirement(id: number, title: string) {
    if (!window.confirm(`هل تريد حذف المعيار «${title}»؟`)) return;
    setMsg("");
    const res = await fetch(`/api/governance?type=requirement&id=${id}`, { method: "DELETE" });
    if (res.ok) {
      await load();
    } else {
      const d = await res.json();
      setMsg(d.error || "فشل الحذف");
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
  const readinessPct = Math.min(100, Math.max(0, stats.compliancePct));

  return (
    <>
      <TrackTitleRow
        title="مسار الحوكمة"
        subtitle={`درجة الجاهزية ومعايير الالتزام — ${PERIOD_LABEL[period]} ${year}`}
        help={GOVERNANCE_HELP}
        extra={<PeriodSelector year={year} period={period} />}
      />

      {msg && (
        <div className="alert alert-warn" style={{ marginBottom: "1rem" }}>
          {msg}
        </div>
      )}

      <div className="card" style={{ marginBottom: "1rem", borderTop: "3px solid var(--tmkeen-primary)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".85rem" }}>
          <h2 style={{ margin: 0, fontSize: "1rem" }}>درجة جاهزية الحوكمة الكلية</h2>
          <span style={{ fontSize: "1.8rem", fontWeight: 800 }}>{readinessPct}%</span>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 99,
            background: "var(--tmkeen-border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${readinessPct}%`,
              background: "var(--tmkeen-primary)",
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

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>توزيع الالتزام</h3>
        <DonutChart
          segments={donutSegments}
          centerLabel={`${readinessPct}%`}
          centerSubLabel="الجاهزية"
        />
      </div>

      <div className="tab-bar" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className={tab === "requirements" ? "active" : ""}
          onClick={() => setTab("requirements")}
        >
          متطلبات
        </button>
        <button
          type="button"
          className={tab === "observations" ? "active" : ""}
          onClick={() => setTab("observations")}
        >
          ملاحظات ({stats.openObservations})
        </button>
      </div>

      {tab === "requirements" && (
        <>
          <div style={{ display: "flex", gap: ".65rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
            <select
              className="input-field"
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
              className="input-field"
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
            <button type="button" className="btn-secondary btn-sm" onClick={() => load()}>
              تحديث
            </button>
            {canManage && (
              <button type="button" className="btn-primary btn-sm" onClick={openCreate}>
                <Plus {...ICON_PROPS} />
                إضافة معيار
              </button>
            )}
          </div>

          <div className="card table-wrap" style={{ marginBottom: "1rem", padding: 0 }}>
            <table className="tmkeen-table table--stack">
              <thead>
                <tr>
                  <th>الرمز</th>
                  <th>المعيار</th>
                  <th>التصنيف</th>
                  <th>الجهة</th>
                  <th>نسبة الالتزام</th>
                  <th>الحالة</th>
                  {canManage && <th>الإجراء</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td data-label="الرمز">{r.code}</td>
                    <td data-label="المعيار">{r.title}</td>
                    <td data-label="التصنيف">{r.category || "—"}</td>
                    <td data-label="الجهة">{r.owner || "—"}</td>
                    <td data-label="نسبة الالتزام">{r.compliancePct}%</td>
                    <td data-label="الحالة">
                      <span className={STATUS_BADGE[r.status] ?? "badge-secondary"}>
                        {GOVERNANCE_STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    {canManage && (
                      <td data-label="إجراءات">
                        <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="btn-secondary btn-sm"
                            aria-label="تعديل"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil {...ICON_PROPS} />
                            تعديل
                          </button>
                          <button
                            type="button"
                            className="btn-danger btn-sm"
                            aria-label="حذف"
                            onClick={() => deleteRequirement(r.id, r.title)}
                          >
                            <Trash2 {...ICON_PROPS} />
                          </button>
                        </div>
                      </td>
                    )}
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
        </>
      )}

      {tab === "observations" && (
        <div className="card table-wrap" style={{ marginBottom: "1rem", padding: 0 }}>
          <table className="tmkeen-table table--stack">
            <thead>
              <tr>
                <th>الملاحظة</th>
                <th>الحالة</th>
                <th>فترة الفتح</th>
                <th>فترة الإغلاق</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((o) => (
                <tr key={o.id}>
                  <td data-label="الملاحظة">{o.title}</td>
                  <td data-label="الحالة">
                    <span className={OBS_STATUS_BADGE[o.status] ?? "badge-secondary"}>
                      {OBS_STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td data-label="فترة الفتح">
                    {PERIOD_LABEL[o.openedPeriod as Period] ?? o.openedPeriod} {o.openedYear}
                  </td>
                  <td data-label="فترة الإغلاق">
                    {o.closedPeriod
                      ? `${PERIOD_LABEL[o.closedPeriod as Period] ?? o.closedPeriod} ${o.closedYear ?? ""}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {observations.length === 0 && (
            <p className="text-muted" style={{ padding: ".75rem 1rem" }}>
              لا توجد ملاحظات مسجّلة.
            </p>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div className="modal-panel card wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingId ? "تعديل معيار حوكمة" : "إضافة معيار حوكمة"}</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setModalOpen(false)}
                aria-label="إغلاق"
                disabled={saving}
              >
                <X {...ICON_PROPS} />
              </button>
            </div>
            <div className="modal-body">
              <div className="field-grid">
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="gov-code">
                    الرمز
                  </label>
                  <input
                    id="gov-code"
                    className="input-field"
                    value={form.code}
                    disabled={saving}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="gov-title">
                    العنوان
                  </label>
                  <input
                    id="gov-title"
                    className="input-field"
                    value={form.title}
                    disabled={saving}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="gov-category">
                    التصنيف
                  </label>
                  <input
                    id="gov-category"
                    className="input-field"
                    value={form.category}
                    disabled={saving}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="gov-owner">
                    الجهة المسؤولة
                  </label>
                  <input
                    id="gov-owner"
                    className="input-field"
                    value={form.owner}
                    disabled={saving}
                    onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  />
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="gov-pct">
                    نسبة الالتزام (%)
                  </label>
                  <input
                    id="gov-pct"
                    className="input-field"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={form.compliancePct}
                    disabled={saving}
                    onChange={(e) => setForm({ ...form, compliancePct: e.target.value })}
                  />
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="gov-status">
                    الحالة
                  </label>
                  <select
                    id="gov-status"
                    className="input-field"
                    value={form.status}
                    disabled={saving}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as RequirementForm["status"] })
                    }
                  >
                    <option value="PENDING">انتظار</option>
                    <option value="COMPLIANT">ملتزم</option>
                    <option value="PARTIAL">جزئي</option>
                    <option value="NON_COMPLIANT">غير ملتزم</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={saving}
                onClick={() => setModalOpen(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                disabled={saving}
                onClick={saveRequirement}
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
