"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, TrendingDown, TrendingUp, X } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import DonutChart from "@/components/charts/DonutChart";
import {
  knowledgeApprovedDonut,
  KNOWLEDGE_STAT_LABELS,
  type KnowledgeStats,
} from "@/lib/knowledge-stats";
import { ICON_PROPS } from "@/lib/icon-props";
import type { Period } from "@/lib/types";

type Asset = {
  id: number;
  title: string;
  assetType: string | null;
  status: string;
  isUsed: boolean;
  department: { name: string } | null;
};

type AssetForm = {
  title: string;
  assetType: string;
  status: "DRAFT" | "APPROVED";
  isUsed: boolean;
};

const emptyForm = (): AssetForm => ({
  title: "",
  assetType: "",
  status: "DRAFT",
  isUsed: false,
});

export default function KnowledgeClient({
  initialStats,
  initialAssets,
  year,
  period,
  canManage,
}: {
  initialStats: KnowledgeStats;
  initialAssets: Asset[];
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
  }

  function openEdit(asset: Asset) {
    setEditingId(asset.id);
    setForm({
      title: asset.title,
      assetType: asset.assetType || "",
      status: asset.status as "DRAFT" | "APPROVED",
      isUsed: asset.isUsed,
    });
    setModalOpen(true);
  }

  async function saveAsset() {
    if (!form.title.trim()) {
      setMsg("العنوان مطلوب");
      return;
    }
    const payload = {
      title: form.title.trim(),
      assetType: form.assetType.trim() || null,
      status: form.status,
      isUsed: form.isUsed,
      year,
      period,
    };

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
  }

  const growthPositive = stats.growthPct >= 0;
  const GrowthIcon = growthPositive ? TrendingUp : TrendingDown;

  const statCards = [
    { num: stats.total, lbl: KNOWLEDGE_STAT_LABELS.total, accent: "" },
    { num: `${stats.approvedPct}%`, lbl: KNOWLEDGE_STAT_LABELS.approvedPct, accent: "stat-card--success" },
    { num: `${stats.usedPct}%`, lbl: KNOWLEDGE_STAT_LABELS.usedPct, accent: "stat-card--secondary" },
    {
      num: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: ".35rem" }}>
          {growthPositive ? "+" : ""}
          {stats.growthPct}%
          <GrowthIcon
            {...ICON_PROPS}
            style={{ color: growthPositive ? "var(--tmkeen-success)" : "var(--tmkeen-danger)" }}
          />
        </span>
      ),
      lbl: KNOWLEDGE_STAT_LABELS.growthPct,
      accent: growthPositive ? "stat-card--success" : "stat-card--danger",
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
        <h3 style={{ marginBottom: ".75rem" }}>نسبة الأصول المعتمدة</h3>
        <DonutChart
          segments={donutSegments}
          centerLabel={`${stats.approvedPct}%`}
          centerSubLabel="معتمد"
        />
      </div>

      <div className="card">
        <table className="tmkeen-table">
          <thead>
            <tr>
              <th>العنوان</th>
              <th>النوع</th>
              <th>الإدارة</th>
              <th>الحالة</th>
              <th>مستخدم؟</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr
                key={a.id}
                style={canManage ? { cursor: "pointer" } : undefined}
                onClick={canManage ? () => openEdit(a) : undefined}
              >
                <td>{a.title}</td>
                <td>{a.assetType || "—"}</td>
                <td>{a.department?.name || "—"}</td>
                <td>
                  <span className={a.status === "APPROVED" ? "badge-success" : "badge-warning"}>
                    {a.status === "APPROVED" ? "معتمد" : "مسودة"}
                  </span>
                </td>
                <td>{a.isUsed ? "نعم" : "لا"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {assets.length === 0 && (
          <p className="text-muted" style={{ padding: "1rem" }}>
            لا توجد أصول في هذه الفترة.
          </p>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-panel card wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingId ? "تعديل أصل معرفي" : "إضافة أصل معرفي"}</h3>
              <button type="button" className="icon-btn" onClick={() => setModalOpen(false)} aria-label="إغلاق">
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
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="asset-type">
                    النوع
                  </label>
                  <input
                    id="asset-type"
                    className="input-field"
                    value={form.assetType}
                    onChange={(e) => setForm({ ...form, assetType: e.target.value })}
                  />
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="asset-status">
                    الحالة
                  </label>
                  <select
                    id="asset-status"
                    className="input-field"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as "DRAFT" | "APPROVED" })
                    }
                  >
                    <option value="DRAFT">مسودة</option>
                    <option value="APPROVED">معتمد</option>
                  </select>
                </div>
                <div className="field-cell field-cell-control">
                  <label className="field-cell-label" htmlFor="asset-used">
                    مستخدم؟
                  </label>
                  <select
                    id="asset-used"
                    className="input-field"
                    value={form.isUsed ? "yes" : "no"}
                    onChange={(e) => setForm({ ...form, isUsed: e.target.value === "yes" })}
                  >
                    <option value="no">لا</option>
                    <option value="yes">نعم</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary btn-sm" onClick={() => setModalOpen(false)}>
                إلغاء
              </button>
              <button type="button" className="btn-primary btn-sm" onClick={saveAsset}>
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
