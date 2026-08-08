"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Check, X } from "lucide-react";
import DonutChart from "@/components/charts/DonutChart";
import BarChartWithTarget from "@/components/charts/BarChartWithTarget";
import PeriodSelector from "@/components/PeriodSelector";
import { CHART_COLORS } from "@/lib/chart-colors";
import { trackBarData, type DashboardOverview } from "@/lib/dashboard-overview-client";
import { PERIOD_LABEL, STATUS_BADGE, STATUS_LABEL, type KpiStatus } from "@/lib/types";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import EmptyState from "@/components/ui/EmptyState";
import { ICON_PROPS } from "@/lib/icon-props";

const DONUT_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
];

export type DepartmentWithSections = {
  id: number;
  deptNo: number;
  name: string;
  color: string;
  sections: { id: number; sectionNo: number; name: string; code: string }[];
};

export type DashboardDeviationKpi = {
  kpiId: number;
  code: string;
  name: string;
  ownerLabel: string | null;
  departmentName: string | null;
  target: number | null;
  actual: number;
  achievementPct: number | null;
  deviationPct: number | null;
  status: KpiStatus;
};

export default function DashboardClient({
  overview,
  byStatus,
  deviationKpis,
  userName,
  departments,
  canManageStructure,
}: {
  overview: DashboardOverview;
  byStatus: Record<string, number>;
  deviationKpis: DashboardDeviationKpi[];
  userName: string;
  departments: DepartmentWithSections[];
  canManageStructure: boolean;
}) {
  const { year, period } = overview;
  const pct = (v: number | null) => (v != null ? `${v}%` : "—");
  const barItems = trackBarData(overview);

  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [deptNames, setDeptNames] = useState<Record<number, string>>(() =>
    Object.fromEntries(departments.map((d) => [d.id, d.name])),
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const trackTiles = [
    { num: pct(overview.strategicPct), lbl: "الأداء الاستراتيجي", accent: "stat-card--success" },
    { num: pct(overview.operationalPct), lbl: "الأداء التشغيلي", accent: "" },
    { num: `${overview.governancePct}%`, lbl: "مسار الحوكمة", accent: "stat-card--secondary" },
    { num: `${overview.knowledgePct}%`, lbl: "المعرفة المؤسسية", accent: "stat-card--warning" },
    { num: overview.earlyWarningCount, lbl: "مؤشرات الإنذار المبكر الفعّالة", accent: "stat-card--danger" },
    { num: overview.approvedEntriesCount, lbl: "إجمالي المؤشرات المعتمدة", accent: "" },
  ];

  const donutSegments = useMemo(
    () =>
      overview.donutSegments.map((s, i) => ({
        name: s.name,
        value: s.value,
        color: DONUT_COLORS[i % DONUT_COLORS.length],
      })),
    [overview.donutSegments]
  );

  function toggleExpanded(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startEdit(dept: DepartmentWithSections) {
    setEditingId(dept.id);
    setEditValue(deptNames[dept.id] ?? dept.name);
  }

  async function saveEdit(id: number) {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setDeptNames((prev) => ({ ...prev, [id]: trimmed }));
        setEditingId(null);
      }
    } finally {
      setSavingId(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  return (
    <>
      <div className="topbar">
        <div>
          <PageBreadcrumb items={[{ label: "الرئيسية", href: "/dashboard" }, { label: "اللوحة" }]} />
          <h1>اللوحة الرئيسية</h1>
          <div className="text-muted">
            أهلًا {userName} · {PERIOD_LABEL[period]} {year}
          </div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      <h3 style={{ marginBottom: "var(--space-2)" }}>نظرة إجمالية على أداء المنصة</h3>
      <div className="grid grid-3" style={{ marginBottom: "var(--space-4)", gap: "var(--space-3)" }}>
        {trackTiles.map((s) => (
          <div key={s.lbl} className={`zad-kpi ${s.accent}`.trim()}>
            <div className="zad-kpi__value">{s.num}</div>
            <div className="zad-kpi__label">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="card zad-table-wrap" style={{ marginBottom: "var(--space-4)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "var(--space-3)",
          }}
        >
          <div>
            <h3 style={{ marginBottom: "var(--space-1)" }}>مؤشرات الانحراف</h3>
            <div className="text-muted" style={{ fontSize: "var(--text-sm)" }}>
              المؤشرات المعتمدة نهائياً بحالة معرّض للخطر أو حرج.
            </div>
          </div>
          <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
            <span className="badge-warning">
              {STATUS_LABEL.AT_RISK} · {deviationKpis.filter((k) => k.status === "AT_RISK").length}
            </span>
            <span className="badge-danger">
              {STATUS_LABEL.CRITICAL} · {deviationKpis.filter((k) => k.status === "CRITICAL").length}
            </span>
          </div>
        </div>
        {deviationKpis.length === 0 ? (
          <EmptyState
            title="لا مؤشرات انحراف"
            body="لا توجد مؤشرات انحراف معتمدة لهذه الفترة."
          />
        ) : (
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>الرمز</th>
                <th>المؤشر</th>
                <th>الإدارة</th>
                <th>المسؤول</th>
                <th>المستهدف</th>
                <th>المتحقق</th>
                <th>الإنجاز</th>
                <th>الانحراف</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {deviationKpis.map((k) => (
                <tr key={k.kpiId}>
                  <td><code>{k.code}</code></td>
                  <td>{k.name}</td>
                  <td>{k.departmentName || "—"}</td>
                  <td>{k.ownerLabel || "—"}</td>
                  <td>{k.target ?? "—"}</td>
                  <td>{k.actual}</td>
                  <td>{pct(k.achievementPct)}</td>
                  <td>{pct(k.deviationPct)}</td>
                  <td>
                    <span className={STATUS_BADGE[k.status]}>{STATUS_LABEL[k.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>مؤشر الأداء التراكمي للمسارات</h3>
        <BarChartWithTarget items={barItems} targetValue={100} keepZeros />
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>التوزيع النسبي للأداء</h3>
        <DonutChart
          segments={donutSegments}
          centerLabel={overview.overallPct != null ? `${overview.overallPct}%` : "—"}
          centerSubLabel="الإنجاز الكلي"
          progressPct={overview.overallPct}
        />
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>الهيكل التنظيمي</h3>
        {departments.length === 0 ? (
          <p className="text-muted">لا توجد إدارات مسجّلة.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
            {departments.map((dept) => {
              const isOpen = expanded.has(dept.id);
              const isEditing = editingId === dept.id;
              const displayName = deptNames[dept.id] ?? dept.name;

              return (
                <div key={dept.id} className="card" style={{ boxShadow: "none", padding: ".75rem 1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: ".75rem",
                      cursor: "pointer",
                    }}
                    onClick={() => !isEditing && toggleExpanded(dept.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flex: 1 }}>
                      <span
                        style={{
                          width: ".5rem",
                          height: ".5rem",
                          borderRadius: "999px",
                          background: dept.color,
                          flexShrink: 0,
                        }}
                      />
                      {isEditing ? (
                        <div
                          style={{ display: "flex", alignItems: "center", gap: ".4rem", flex: 1 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            className="input-field"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(dept.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                            disabled={savingId === dept.id}
                          />
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => saveEdit(dept.id)}
                            disabled={savingId === dept.id}
                            aria-label="حفظ"
                          >
                            <Check {...ICON_PROPS} />
                          </button>
                          <button type="button" className="icon-btn" onClick={cancelEdit} aria-label="إلغاء">
                            <X {...ICON_PROPS} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 700, fontSize: ".88rem" }}>
                          {dept.deptNo}. {displayName}
                        </span>
                      )}
                      <span className="text-muted" style={{ fontSize: ".75rem" }}>
                        {dept.sections.length} قسم
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                      {canManageStructure && !isEditing && (
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(dept);
                          }}
                          aria-label="تعديل اسم الإدارة"
                        >
                          <Pencil {...ICON_PROPS} />
                        </button>
                      )}
                      {isOpen ? <ChevronUp {...ICON_PROPS} /> : <ChevronDown {...ICON_PROPS} />}
                    </div>
                  </div>
                  {isOpen && dept.sections.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginTop: ".65rem" }}>
                      {dept.sections.map((sec) => (
                        <span key={sec.id} className="badge-secondary">
                          {sec.code} · {sec.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h3>
          توزيع حالات المؤشرات المعتمدة — {PERIOD_LABEL[period]} {year}
        </h3>
        {Object.keys(byStatus).length === 0 ? (
          <p className="text-muted">لا توجد قياسات معتمدة لهذه الفترة بعد.</p>
        ) : (
          <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", alignItems: "center" }}>
            {(Object.keys(byStatus) as KpiStatus[]).map((s) => (
              <span key={s} className={STATUS_BADGE[s]} style={{ fontSize: ".72rem" }}>
                {STATUS_LABEL[s]} · {byStatus[s]}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
