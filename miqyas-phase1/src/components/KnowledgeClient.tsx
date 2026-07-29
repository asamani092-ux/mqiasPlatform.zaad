"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import DonutChart from "@/components/charts/DonutChart";
import {
  ASSET_STATUS_BADGE,
  ASSET_STATUS_LABEL,
  ASSET_STATUSES,
  knowledgeApprovedDonut,
  KNOWLEDGE_STAT_LABELS,
  type AssetStatusValue,
  type KnowledgeStats,
} from "@/lib/knowledge-stats";
import { ASSET_TYPES } from "@/lib/knowledge-constants";
import { ICON_PROPS } from "@/lib/icon-props";
import type { Period } from "@/lib/types";

type Department = { id: number; name: string };
type KpiOption = { id: number; code: string; name: string };

type Asset = {
  id: number;
  title: string;
  assetType: string | null;
  status: string;
  isUsed: boolean;
  departmentId: number | null;
  kpiId: number | null;
  department: { name: string } | null;
  kpi: { id: number; code: string; name: string } | null;
};

type AssetForm = {
  title: string;
  assetType: string;
  departmentId: string;
  kpiId: string;
  status: AssetStatusValue;
  isUsed: boolean;
};

const emptyForm = (): AssetForm => ({
  title: "",
  assetType: ASSET_TYPES[0],
  departmentId: "",
  kpiId: "",
  status: "DRAFT",
  isUsed: false,
});

export default function KnowledgeClient({
  initialStats,
  initialAssets,
  departments,
  kpis,
  year,
  period,
  canManage,
}: {
  initialStats: KnowledgeStats;
  initialAssets: Asset[];
  departments: Department[];
  kpis: KpiOption[];
  year: number;
  period: Period;
  canManage: boolean;
}) {
  const [stats, setStats] = useState(initialStats);
  const [assets, setAssets] = useState(initialAssets);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AssetForm>(emptyForm());
  const [msg, setMsg] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/knowledge?year=${year}&period=${period}`);
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setAssets(data.assets);
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

  function openEdit(asset: Asset) {
    setEditingId(asset.id);
    setForm({
      title: asset.title,
      assetType: asset.assetType && ASSET_TYPES.includes(asset.assetType as (typeof ASSET_TYPES)[number])
        ? asset.assetType
        : ASSET_TYPES[0],
      departmentId: asset.departmentId != null ? String(asset.departmentId) : "",
      kpiId: asset.kpiId != null ? String(asset.kpiId) : "",
      status: (ASSET_STATUSES.includes(asset.status as AssetStatusValue)
        ? asset.status
        : "DRAFT") as AssetStatusValue,
      isUsed: asset.isUsed,
    });
    setModalOpen(true);
    setMsg("");
  }

  async function saveAsset() {
    if (!form.title.trim()) {
      setMsg("العنوان مطلوب");
      return;
    }
    const payload = {
      title: form.title.trim(),
      assetType: form.assetType,
      departmentId: form.departmentId ? parseInt(form.departmentId, 10) : null,
      kpiId: form.kpiId ? parseInt(form.kpiId, 10) : null,
      status: form.status,
      isUsed: form.isUsed,
      year,
      period,
    };

    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/knowledge", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      if (res.ok) {
        setModalOpen(false);
        setMsg("");
        await load();
      } else {
        const d = await res.json();
        setMsg(d.error || "فشل الحفظ");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteAsset(id: number, title: string) {
    if (!window.confirm(`هل تريد حذف «${title}»؟`)) return;
    setMsg("");
    const res = await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      await load();
    } else {
      const d = await res.json();
      setMsg(d.error || "فشل الحذف");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (typeFilter && a.assetType !== typeFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (q) {
        const hay = `${a.title} ${a.assetType ?? ""} ${a.department?.name ?? ""} ${a.kpi?.code ?? ""} ${a.kpi?.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [assets, typeFilter, statusFilter, search]);

  const statCards = [
    { num: stats.total, lbl: KNOWLEDGE_STAT_LABELS.total, accent: "" },
    { num: `${stats.approvedPct}%`, lbl: KNOWLEDGE_STAT_LABELS.approvedPct, accent: "stat-card--success" },
    { num: `${stats.usedPct}%`, lbl: KNOWLEDGE_STAT_LABELS.usedPct, accent: "stat-card--secondary" },
    {
      num: stats.linkedToKpiCount,
      lbl: KNOWLEDGE_STAT_LABELS.linkedToKpiCount,
      accent: "stat-card--success",
    },
  ];

  const donutSegments = knowledgeApprovedDonut(stats);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار المعرفة المؤسسية</h1>
          <div className="text-muted">أصول المعرفة والدروس المستفادة</div>
        </div>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
          {canManage && (
            <button type="button" className="btn-primary btn-sm" onClick={openCreate}>
              <Plus {...ICON_PROPS} />
              إضافة أصل
            </button>
          )}
          <PeriodSelector year={year} period={period} />
        </div>
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
        <h3 style={{ marginBottom: ".75rem" }}>نسبة الأصول النشطة</h3>
        <DonutChart
          segments={donutSegments}
          centerLabel={`${stats.approvedPct}%`}
          centerSubLabel="نشط"
        />
      </div>

      <div style={{ display: "flex", gap: ".65rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        <input
          className="input-field"
          style={{ width: "min(240px, 100%)" }}
          placeholder="بحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="inp"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ width: "auto" }}
        >
          <option value="">كل الأنواع</option>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className="inp"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: "auto" }}
        >
          <option value="">كل الحالات</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>{ASSET_STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      <div className="kpi-grid">
        {filtered.map((a) => (
          <div key={a.id} className="card kpi-card" style={{ textAlign: "start" }}>
            <div className="kpi-row">
              <span className="kpi-code">{a.assetType || "أخرى"}</span>
              <span className={ASSET_STATUS_BADGE[a.status] || "badge-secondary"}>
                {ASSET_STATUS_LABEL[a.status] || a.status}
              </span>
            </div>
            <div className="kpi-name">{a.title}</div>
            <div className="text-muted" style={{ fontSize: ".78rem", marginBottom: ".5rem" }}>
              {a.department?.name || "—"}
            </div>
            <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", alignItems: "center" }}>
              <span className={a.isUsed ? "badge-success" : "badge-neutral"}>
                {a.isUsed ? "مستخدم" : "غير مستخدم"}
              </span>
              {a.kpiId != null && (
                <span className="badge-secondary">
                  مؤشر: {a.kpi?.code || a.kpiId}
                </span>
              )}
              {canManage && (
                <div style={{ marginInlineStart: "auto", display: "flex", gap: ".25rem" }}>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    aria-label="تعديل"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil {...ICON_PROPS} />
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    aria-label="حذف"
                    onClick={() => deleteAsset(a.id, a.title)}
                  >
                    <Trash2 {...ICON_PROPS} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card">
          <p className="text-muted">لا توجد أصول مطابقة.</p>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div className="modal-panel card wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingId ? "تعديل أصل معرفي" : "إضافة أصل معرفي"}</h3>
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
                  <label className="field-cell-label" htmlFor="asset-title">
                    العنوان
                  </label>
                  <input
                    id="asset-title"
                    className="input-field"
                    value={form.title}
                    disabled={saving}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="asset-type">
                    النوع
                  </label>
                  <select
                    id="asset-type"
                    className="input-field"
                    value={form.assetType}
                    disabled={saving}
                    onChange={(e) => setForm({ ...form, assetType: e.target.value })}
                  >
                    {ASSET_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="asset-dept">
                    الإدارة
                  </label>
                  <select
                    id="asset-dept"
                    className="input-field"
                    value={form.departmentId}
                    disabled={saving}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  >
                    <option value="">— اختر إدارة —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="asset-status">
                    الحالة
                  </label>
                  <select
                    id="asset-status"
                    className="input-field"
                    value={form.status}
                    disabled={saving}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as AssetStatusValue })
                    }
                  >
                    {ASSET_STATUSES.map((s) => (
                      <option key={s} value={s}>{ASSET_STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="asset-kpi">
                    مؤشر مرتبط (اختياري)
                  </label>
                  <select
                    id="asset-kpi"
                    className="input-field"
                    value={form.kpiId}
                    disabled={saving}
                    onChange={(e) => setForm({ ...form, kpiId: e.target.value })}
                  >
                    <option value="">— بدون ربط —</option>
                    {kpis.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.code} — {k.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="asset-used" style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                    <input
                      id="asset-used"
                      type="checkbox"
                      checked={form.isUsed}
                      disabled={saving}
                      onChange={(e) => setForm({ ...form, isUsed: e.target.checked })}
                    />
                    مستخدم
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
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
                onClick={saveAsset}
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
