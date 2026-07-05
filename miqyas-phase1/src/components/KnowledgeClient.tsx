"use client";

import { useCallback, useEffect, useState } from "react";
import PeriodSelector from "@/components/PeriodSelector";
import type { Period } from "@/lib/types";

type Stats = {
  total: number;
  approvedPct: number;
  usedPct: number;
  growthPct: number;
};

type Asset = {
  id: number;
  title: string;
  assetType: string | null;
  status: string;
  isUsed: boolean;
  department: { name: string } | null;
};

export default function KnowledgeClient({
  initialStats,
  initialAssets,
  year,
  period,
  canManage,
}: {
  initialStats: Stats;
  initialAssets: Asset[];
  year: number;
  period: Period;
  canManage: boolean;
}) {
  const [stats, setStats] = useState(initialStats);
  const [assets, setAssets] = useState(initialAssets);
  const [newAsset, setNewAsset] = useState({ title: "", assetType: "" });

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

  async function addAsset() {
    if (!newAsset.title.trim()) return;
    await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newAsset.title,
        assetType: newAsset.assetType || null,
        year,
        period,
      }),
    });
    setNewAsset({ title: "", assetType: "" });
    await load();
  }

  async function updateAsset(id: number, patch: Record<string, unknown>) {
    await fetch("/api/knowledge", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    await load();
  }

  const statCards = [
    { num: stats.total, lbl: "عدد الأصول", color: "var(--maroon)" },
    { num: `${stats.approvedPct}%`, lbl: "نسبة المعتمدة", color: "var(--green)" },
    { num: `${stats.usedPct}%`, lbl: "نسبة المستخدمة", color: "var(--gold)" },
    { num: `${stats.growthPct}%`, lbl: "نمو المعرفة", color: "var(--amber)" },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مسار المعرفة المؤسسية</h1>
          <div className="sub">أصول المعرفة والدروس المستفادة</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
        {statCards.map((s) => (
          <div key={s.lbl} className="card stat" style={{ borderRightColor: s.color }}>
            <div className="num">{s.num}</div>
            <div className="lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr><th>العنوان</th><th>النوع</th><th>الإدارة</th><th>الحالة</th><th>مستخدم؟</th></tr></thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.assetType || "—"}</td>
                <td>{a.department?.name || "—"}</td>
                <td>
                  {canManage ? (
                    <button
                      type="button"
                      className={`badge ${a.status === "APPROVED" ? "achieved" : "pending"}`}
                      onClick={() => updateAsset(a.id, { status: a.status === "APPROVED" ? "DRAFT" : "APPROVED" })}
                    >
                      {a.status === "APPROVED" ? "معتمد" : "مسودة"}
                    </button>
                  ) : (
                    <span className={`badge ${a.status === "APPROVED" ? "achieved" : "pending"}`}>
                      {a.status === "APPROVED" ? "معتمد" : "مسودة"}
                    </span>
                  )}
                </td>
                <td>
                  {canManage ? (
                    <button type="button" className="btn-sm btn-ghost" onClick={() => updateAsset(a.id, { isUsed: !a.isUsed })}>
                      {a.isUsed ? "نعم" : "لا"}
                    </button>
                  ) : (
                    a.isUsed ? "نعم" : "لا"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assets.length === 0 && <p className="sub">لا توجد أصول في هذه الفترة.</p>}
        {canManage && (
          <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem" }}>
            <input className="inp" placeholder="عنوان الأصل" value={newAsset.title} onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })} />
            <input className="inp" placeholder="النوع" value={newAsset.assetType} onChange={(e) => setNewAsset({ ...newAsset, assetType: e.target.value })} />
            <button type="button" className="btn btn-sm" onClick={addAsset}>إضافة</button>
          </div>
        )}
      </div>
    </>
  );
}
