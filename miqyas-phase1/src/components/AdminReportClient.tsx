"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import BrandMark from "@/components/BrandMark";
import { PERIOD_LABEL, STATUS_LABEL, type Period } from "@/lib/types";
import { notifyToast } from "@/lib/ui-toast";

type ReportKpi = {
  kpiId: number;
  code: string;
  name: string;
  departmentName: string | null;
  target: number | null;
  actual: number | null;
  achievementPct: number | null;
  status: string;
};

type ReportPayload = {
  year: number;
  period: string;
  periodLabel: string;
  summary: {
    measured: number;
    avgAchievement: number | null;
    atRisk: number;
    achieved: number;
    onTrack: number;
    critical: number;
  };
  byStatus: Record<string, number>;
  byDepartment: { name: string; count: number; avgAchievement: number | null }[];
  kpis: ReportKpi[];
};

type SlideId =
  | "cover"
  | "summary"
  | "kpis"
  | "distribution"
  | "achievement"
  | "departments"
  | "closing";

const OPTIONAL_SLIDES: { id: Exclude<SlideId, "cover" | "closing">; label: string }[] = [
  { id: "summary", label: "الملخّص التنفيذي" },
  { id: "kpis", label: "المؤشرات الرئيسية" },
  { id: "distribution", label: "توزيع الحالات" },
  { id: "achievement", label: "نسب الإنجاز" },
  { id: "departments", label: "أداء الإدارات" },
];

const PERIOD_OPTIONS = Object.entries(PERIOD_LABEL) as [Period, string][];

const DIST_COLORS = [
  "var(--primary-600)",
  "var(--brand-secondary)",
  "var(--success-solid)",
  "var(--warning-solid)",
  "var(--info-solid)",
];

export default function AdminReportClient() {
  const nowYear = new Date().getFullYear();
  const [year, setYear] = useState(nowYear);
  const [period, setPeriod] = useState<Period>("Q3");
  const [title, setTitle] = useState("تقرير الأداء الاستراتيجي");
  const [orgName, setOrgName] = useState("جمعية الزاد للتمكين المستدام");
  const [deptName, setDeptName] = useState("إدارة الأداء والنمو");
  const [closingTitle, setClosingTitle] = useState("شكراً لكم");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    summary: true,
    kpis: true,
    distribution: true,
    achievement: true,
    departments: true,
  });
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [presenting, setPresenting] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [printAll, setPrintAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/report?year=${year}&period=${period}`);
    if (res.ok) {
      setData(await res.json());
    } else {
      notifyToast.error("تعذر تحميل بيانات التقرير");
      setData(null);
    }
    setLoading(false);
  }, [year, period]);

  useEffect(() => {
    void load();
  }, [load]);

  const periodDisplay = useMemo(() => {
    if (data) return `${data.periodLabel} ${data.year}`;
    return `${PERIOD_LABEL[period]} ${year}`;
  }, [data, period, year]);

  const deck = useMemo(() => {
    const ids: SlideId[] = ["cover"];
    for (const s of OPTIONAL_SLIDES) {
      if (enabled[s.id]) ids.push(s.id);
    }
    ids.push("closing");
    return ids;
  }, [enabled]);

  useEffect(() => {
    if (!presenting) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPresenting(false);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setSlideIdx((i) => Math.min(deck.length - 1, i + 1));
      }
      if (e.key === "ArrowRight" || e.key === "PageUp") {
        e.preventDefault();
        setSlideIdx((i) => Math.max(0, i - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting, deck.length]);

  function startPresent() {
    setSlideIdx(0);
    setPrintAll(false);
    setPresenting(true);
  }

  /** تصدير PDF — يعرض كل الشرائح ثم يطبع بدون صفحات فارغة من الواجهة الخلفية */
  function exportPdf() {
    if (!data) return;
    setSlideIdx(0);
    setPrintAll(true);
    setPresenting(true);
    window.setTimeout(() => {
      window.print();
    }, 200);
  }

  useEffect(() => {
    function onAfterPrint() {
      setPrintAll(false);
    }
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  function toggleAll(on: boolean) {
    const next: Record<string, boolean> = {};
    for (const s of OPTIONAL_SLIDES) next[s.id] = on;
    setEnabled(next);
  }

  const current = deck[slideIdx] ?? "cover";
  const progressPct = deck.length > 1 ? `${(slideIdx / (deck.length - 1)) * 100}%` : "100%";

  const topKpis = (data?.kpis ?? [])
    .filter((k) => k.achievementPct != null)
    .sort((a, b) => (b.achievementPct as number) - (a.achievementPct as number))
    .slice(0, 8);

  const summaryPoints = useMemo(() => {
    if (!data) return [];
    return [
      `تم اعتماد ${data.summary.measured} مؤشراً نهائياً لفترة ${periodDisplay}.`,
      `متوسط التحقق ${data.summary.avgAchievement ?? "—"}٪ عبر المؤشرات المعتمدة.`,
      `${data.summary.achieved} مؤشراً محققاً (≥100٪) و${data.summary.onTrack} على المسار.`,
      `${data.summary.atRisk} مؤشراً في نطاق الخطر/الحرج يتطلب متابعة.`,
    ];
  }, [data, periodDisplay]);

  const distItems = useMemo(() => {
    if (!data) return [];
    const total = Math.max(1, data.summary.measured);
    const rows = [
      { label: "محقق", value: data.byStatus?.ACHIEVED ?? 0 },
      { label: "على المسار", value: data.byStatus?.ON_TRACK ?? 0 },
      { label: "معرّض", value: data.byStatus?.AT_RISK ?? 0 },
      { label: "حرج", value: data.byStatus?.CRITICAL ?? 0 },
    ];
    return rows.map((r, i) => ({
      ...r,
      pct: Math.round((r.value / total) * 1000) / 10,
      color: DIST_COLORS[i % DIST_COLORS.length],
    }));
  }, [data]);

  const distGradient = useMemo(() => {
    if (distItems.length === 0 || !data?.summary.measured) {
      return `conic-gradient(var(--brand-secondary) 0 100%)`;
    }
    let acc = 0;
    const stops: string[] = [];
    for (const item of distItems) {
      const start = acc;
      acc += item.pct;
      stops.push(`${item.color} ${start}% ${acc}%`);
    }
    return `conic-gradient(${stops.join(", ")})`;
  }, [distItems, data?.summary.measured]);

  const kpiCards = useMemo(() => {
    if (!data) return [];
    return [
      { label: "مؤشرات معتمدة", value: data.summary.measured, delta: periodDisplay },
      {
        label: "متوسط التحقق",
        value: data.summary.avgAchievement != null ? `${data.summary.avgAchievement}%` : "—",
        delta: "نهائي",
      },
      { label: "محقق ≥100%", value: data.summary.achieved, delta: "إنجاز" },
      { label: "حرج / خطر", value: data.summary.atRisk, delta: "متابعة" },
    ];
  }, [data, periodDisplay]);

  return (
    <>
      <PageBreadcrumb
        items={[
          { label: "لوحة المؤشرات", href: "/dashboard" },
          { label: "منشئ العرض التقديمي" },
        ]}
      />

      <div className="zrp-builder-page">
        <div className="zrp-builder-head">
          <BrandMark variant="login" />
          <div>
            <h1>مُنشئ العرض التقديمي للتقارير</h1>
            <div className="text-muted" style={{ fontSize: "var(--text-sm)" }}>
              اختر مكوّنات العرض، ثم اعرضه مباشرة وفق دليل الهوية للتقارير التقديمية.
            </div>
          </div>
        </div>

        <div className="zrp-builder">
          <section className="card zrp-panel">
            <h2 className="zrp-panel-title">مكوّنات العرض</h2>
            <p className="text-muted" style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-2xs)" }}>
              الغلاف والخاتمة يظهران دائماً. فعّل ما تريد إظهاره بينهما.
            </p>
            <div className="zrp-toggles">
              {OPTIONAL_SLIDES.map((s) => {
                const on = !!enabled[s.id];
                return (
                  <div key={s.id} className={`zrp-toggle-row ${on ? "is-on" : ""}`}>
                    <span>{s.label}</span>
                    <button
                      type="button"
                      className="zrp-switch"
                      role="switch"
                      aria-checked={on}
                      aria-label={s.label}
                      onClick={() => setEnabled((prev) => ({ ...prev, [s.id]: !on }))}
                    >
                      <span className="zrp-switch__knob" />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="btn-ghost btn-sm"
              style={{ marginTop: "var(--space-3)", color: "var(--primary-600)", textDecoration: "underline" }}
              onClick={() => toggleAll(true)}
            >
              تفعيل الكل
            </button>
          </section>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <section className="card zrp-panel">
              <h2 className="zrp-panel-title">المظهر</h2>
              <div className="zrp-theme-row" role="group" aria-label="مظهر العرض">
                <button
                  type="button"
                  className={`zrp-theme-btn ${theme === "light" ? "is-active" : ""}`}
                  onClick={() => setTheme("light")}
                >
                  <span className="zrp-theme-btn__swatch zrp-theme-btn__swatch--light" />
                  نهاري
                </button>
                <button
                  type="button"
                  className={`zrp-theme-btn ${theme === "dark" ? "is-active" : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  <span className="zrp-theme-btn__swatch zrp-theme-btn__swatch--dark" />
                  ليلي
                </button>
              </div>

              <div className="zrp-fields">
                <div>
                  <label className="label-field" htmlFor="report-title">
                    عنوان التقرير
                  </label>
                  <input
                    id="report-title"
                    className="input-field"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-field" htmlFor="report-year">
                    السنة
                  </label>
                  <input
                    id="report-year"
                    className="input-field"
                    type="number"
                    min={2020}
                    max={2100}
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10) || nowYear)}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="label-field" htmlFor="report-period">
                    الفترة
                  </label>
                  <select
                    id="report-period"
                    className="input-field"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as Period)}
                  >
                    {PERIOD_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field" htmlFor="report-org">
                    اسم الجهة
                  </label>
                  <input
                    id="report-org"
                    className="input-field"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-field" htmlFor="report-dept">
                    القسم / الإدارة
                  </label>
                  <input
                    id="report-dept"
                    className="input-field"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-field" htmlFor="report-closing">
                    عنوان الخاتمة
                  </label>
                  <input
                    id="report-closing"
                    className="input-field"
                    value={closingTitle}
                    onChange={(e) => setClosingTitle(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="card zrp-panel zrp-actions">
              <p className="text-muted" style={{ fontSize: "var(--text-2xs)", margin: 0 }}>
                عدد الشرائح: <strong style={{ color: "var(--primary-600)" }}>{deck.length}</strong>
                {data ? ` · ${data.summary.measured} مؤشراً معتمداً · ${periodDisplay}` : null}
              </p>
              <button
                type="button"
                className="btn-primary btn-block"
                onClick={startPresent}
                disabled={loading || !data}
              >
                بدء العرض
              </button>
              <button
                type="button"
                className="btn-recommend btn-block"
                onClick={startPresent}
                disabled={loading || !data}
              >
                معاينة العرض
              </button>
              <button
                type="button"
                className="btn-secondary btn-block"
                onClick={exportPdf}
                disabled={!data}
              >
                طباعة / تصدير PDF
              </button>
              <Link href="/admin/settings" className="text-muted" style={{ fontSize: "var(--text-2xs)" }}>
                إعدادات جولة القياس
              </Link>
            </section>
          </div>
        </div>

        {loading ? <p className="text-muted" style={{ marginTop: "var(--space-4)" }}>جاري تحميل بيانات الفترة...</p> : null}
        {!loading && data && data.summary.measured === 0 ? (
          <div className="alert alert-info" style={{ marginTop: "var(--space-4)" }}>
            لا توجد مؤشرات معتمدة نهائياً لـ {periodDisplay}. غيّر الفترة أو أكمل الاعتماد النهائي أولاً.
          </div>
        ) : null}
      </div>

      {presenting && data ? (
        <div
          className={`zrp-stage zrp-stage--${theme}${printAll ? " zrp-stage--print printable-region" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="عرض تقديمي"
        >
          <div
            className="zrp-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={deck.length}
            aria-valuenow={slideIdx + 1}
            aria-label={`الشريحة ${slideIdx + 1} من ${deck.length}`}
          >
            <div className="zrp-progress__fill" style={{ width: progressPct }} />
          </div>
          <div className="zrp-stage-body">
            <div className="zrp-stage-logo">
              <BrandMark variant="login" />
            </div>
            {(printAll ? deck : [current]).map((slideId) => (
            <div className="zrp-slide" key={`${slideId}-${printAll ? "all" : slideIdx}`}>
              {slideId === "cover" ? (
                <div className="zrp-slide-center">
                  <div className="zrp-accent-bar" />
                  <h1 className="zrp-cover-title">{title}</h1>
                  <p className="zrp-cover-period">{periodDisplay}</p>
                  <p className="zrp-cover-meta">
                    {orgName} · {deptName}
                  </p>
                </div>
              ) : null}

              {current === "summary" ? (
                <div>
                  <h2 className="zrp-slide-title">الملخّص التنفيذي</h2>
                  <div className="zrp-summary-list">
                    {summaryPoints.map((text) => (
                      <div key={text} className="zrp-summary-item">
                        <span className="zrp-summary-dot" aria-hidden="true" />
                        <p>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {current === "kpis" ? (
                <div>
                  <h2 className="zrp-slide-title">المؤشرات الرئيسية</h2>
                  <div className="zrp-kpis">
                    {kpiCards.map((k) => (
                      <div key={k.label} className="zrp-kpi-card">
                        <div className="zrp-kpi-card__label">{k.label}</div>
                        <div className="zrp-kpi-card__value">{k.value}</div>
                        <div className="zrp-kpi-card__delta">{k.delta}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {current === "distribution" ? (
                <div>
                  <h2 className="zrp-slide-title">توزيع الحالات</h2>
                  <div className="zrp-dist">
                    <div className="zrp-donut" aria-hidden="true">
                      <div className="zrp-donut__ring" style={{ background: distGradient }} />
                      <div className="zrp-donut__hole">
                        <span className="zrp-donut__label">التوزيع</span>
                        <span className="zrp-donut__value">{data.summary.measured}</span>
                        <span className="zrp-donut__label">مؤشر معتمد</span>
                      </div>
                    </div>
                    <div className="zrp-dist-list">
                      {distItems.map((x) => (
                        <div key={x.label} className="zrp-dist-item">
                          <div className="zrp-dist-item__row">
                            <span className="zrp-dist-swatch" style={{ background: x.color }} />
                            <span style={{ flex: 1, fontWeight: 600 }}>{x.label}</span>
                            <strong style={{ color: "var(--zrp-head)" }}>{x.value}</strong>
                          </div>
                          <div className="zrp-dist-item__bar">
                            <span style={{ width: `${x.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {current === "achievement" ? (
                <div>
                  <h2 className="zrp-slide-title">نسب الإنجاز</h2>
                  <div className="zrp-bars">
                    {topKpis.slice(0, 6).map((k) => (
                      <div key={k.kpiId} className="zrp-bar-row">
                        <div className="zrp-bar-label">
                          <span>
                            {k.code} — {k.name}
                          </span>
                          <strong dir="ltr">{k.achievementPct ?? 0}٪</strong>
                        </div>
                        <div className="zrp-bar-track">
                          <div
                            className="zrp-bar-fill"
                            style={{
                              width: `${Math.min(100, Math.max(0, k.achievementPct ?? 0))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {topKpis.length === 0 ? (
                      <p className="text-muted">لا نسب إنجاز متاحة لهذه الفترة</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {current === "departments" ? (
                <div>
                  <h2 className="zrp-slide-title">أداء الإدارات</h2>
                  <table className="zrp-table">
                    <thead>
                      <tr>
                        <th>الإدارة</th>
                        <th>عدد المؤشرات</th>
                        <th>متوسط التحقق %</th>
                        <th>الحالة الأبرز</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.byDepartment ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={4}>لا بيانات</td>
                        </tr>
                      ) : (
                        data.byDepartment.map((d) => (
                          <tr key={d.name}>
                            <td>{d.name}</td>
                            <td dir="ltr">{d.count}</td>
                            <td dir="ltr">{d.avgAchievement ?? "—"}</td>
                            <td>
                              {d.avgAchievement == null
                                ? "—"
                                : d.avgAchievement >= 100
                                  ? STATUS_LABEL.ACHIEVED
                                  : d.avgAchievement >= 80
                                    ? STATUS_LABEL.ON_TRACK
                                    : d.avgAchievement >= 60
                                      ? STATUS_LABEL.AT_RISK
                                      : STATUS_LABEL.CRITICAL}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {current === "closing" ? (
                <div className="zrp-slide-center">
                  <div className="zrp-accent-bar" />
                  <h1 className="zrp-cover-title">{closingTitle}</h1>
                  <p className="zrp-cover-period">{periodDisplay}</p>
                  <p className="zrp-cover-meta">
                    {orgName} · يُعتمد العرض على القيم النهائية فقط
                  </p>
                </div>
              ) : null}
            </div>
            ))}
          </div>

          <div className="zrp-nav">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
              disabled={slideIdx === 0}
            >
              السابق
            </button>
            <span>
              شريحة {slideIdx + 1} / {deck.length}
            </span>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setSlideIdx((i) => Math.min(deck.length - 1, i + 1))}
              disabled={slideIdx >= deck.length - 1}
            >
              التالي
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={() => setPresenting(false)}>
              إنهاء
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
