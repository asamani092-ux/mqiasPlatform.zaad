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

export default function AdminReportClient() {
  const nowYear = new Date().getFullYear();
  const [year, setYear] = useState(nowYear);
  const [period, setPeriod] = useState<Period>("Q3");
  const [title, setTitle] = useState("تقرير الأداء الاستراتيجي");
  const [closingTitle, setClosingTitle] = useState("شكراً لكم");
  const [theme, setTheme] = useState<"light" | "dark">("light");
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
    setPresenting(true);
  }

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

  const statusRows = [
    ["محقق", data?.byStatus?.ACHIEVED ?? 0],
    ["على المسار", data?.byStatus?.ON_TRACK ?? 0],
    ["معرّض", data?.byStatus?.AT_RISK ?? 0],
    ["حرج", data?.byStatus?.CRITICAL ?? 0],
  ] as const;

  return (
    <>
      <PageBreadcrumb
        items={[
          { label: "لوحة المؤشرات", href: "/dashboard" },
          { label: "منشئ العرض التقديمي" },
        ]}
      />

      <div className="topbar">
        <div>
          <h1>منشئ العرض التقديمي</h1>
          <div className="text-muted">تقرير فترة محددة من القيم المعتمدة نهائياً</div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Link className="btn-secondary btn-sm" href="/admin/settings">
            إعدادات الجولة
          </Link>
          <button type="button" className="btn-primary btn-sm" onClick={startPresent} disabled={loading || !data}>
            بدء العرض
          </button>
        </div>
      </div>

      <div className="zrp-builder">
        <section className="card zrp-panel">
          <h2 className="zrp-panel-title">مكوّنات العرض</h2>
          <p className="text-muted" style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-xs)" }}>
            الغلاف والخاتمة يظهران دائماً. فعّل الشرائح بينهما.
          </p>
          <div className="zrp-toggles">
            {OPTIONAL_SLIDES.map((s) => (
              <label key={s.id} className="zrp-toggle-row">
                <span>{s.label}</span>
                <input
                  type="checkbox"
                  checked={!!enabled[s.id]}
                  onChange={(e) => setEnabled((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                />
              </label>
            ))}
          </div>
          <button type="button" className="btn-secondary btn-sm" style={{ marginTop: "var(--space-3)" }} onClick={() => toggleAll(true)}>
            تفعيل الكل
          </button>
        </section>

        <section className="card zrp-panel">
          <h2 className="zrp-panel-title">الفترة والمظهر</h2>
          <div className="zrp-fields">
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

          <div className="zrp-theme-row" role="group" aria-label="مظهر العرض">
            <button
              type="button"
              className={`zrp-theme-btn ${theme === "light" ? "is-active" : ""}`}
              onClick={() => setTheme("light")}
            >
              نهاري
            </button>
            <button
              type="button"
              className={`zrp-theme-btn ${theme === "dark" ? "is-active" : ""}`}
              onClick={() => setTheme("dark")}
            >
              ليلي
            </button>
          </div>

          <div className="zrp-actions">
            <p className="text-muted" style={{ fontSize: "var(--text-xs)", margin: 0 }}>
              عدد الشرائح: <strong style={{ color: "var(--tmkeen-primary)" }}>{deck.length}</strong>
              {data ? ` · ${data.summary.measured} مؤشراً معتمداً · ${periodDisplay}` : null}
            </p>
            <button type="button" className="btn-primary" style={{ width: "100%" }} onClick={startPresent} disabled={loading || !data}>
              بدء العرض
            </button>
            <button type="button" className="btn-secondary" style={{ width: "100%" }} onClick={() => window.print()} disabled={!data}>
              طباعة / تصدير
            </button>
          </div>
        </section>
      </div>

      {loading ? <p className="text-muted">جاري تحميل بيانات الفترة...</p> : null}
      {!loading && data && data.summary.measured === 0 ? (
        <div className="alert alert-info" style={{ marginTop: "var(--space-4)" }}>
          لا توجد مؤشرات معتمدة نهائياً لـ {periodDisplay}. غيّر الفترة أو أكمل الاعتماد النهائي أولاً.
        </div>
      ) : null}

      {presenting && data ? (
        <div className={`zrp-stage zrp-stage--${theme}`} role="dialog" aria-modal="true" aria-label="عرض تقديمي">
          <div className="zrp-progress" aria-hidden="true">
            <div className="zrp-progress__fill" style={{ width: progressPct }} />
          </div>
          <div className="zrp-stage-logo">
            <BrandMark variant="login" />
          </div>
          <div className="zrp-slide">
            {current === "cover" ? (
              <div className="zrp-slide-center">
                <div className="zrp-accent-bar" />
                <h1 className="zrp-cover-title">{title}</h1>
                <p className="zrp-cover-period">{periodDisplay}</p>
                <p className="zrp-cover-meta">القيم المعتمدة نهائياً فقط</p>
              </div>
            ) : null}

            {current === "summary" ? (
              <div>
                <h2 className="zrp-slide-title">الملخّص التنفيذي</h2>
                <div className="zrp-kpis">
                  {[
                    ["مؤشرات معتمدة", data.summary.measured],
                    ["متوسط التحقق %", data.summary.avgAchievement ?? "—"],
                    ["محقق ≥100%", data.summary.achieved],
                    ["حرج / خطر", data.summary.atRisk],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="zad-kpi">
                      <div className="zad-kpi__label">{label}</div>
                      <div className="zad-kpi__value">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {current === "kpis" ? (
              <div>
                <h2 className="zrp-slide-title">المؤشرات الرئيسية</h2>
                <div className="zad-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>الرمز</th>
                        <th>المؤشر</th>
                        <th>الإدارة</th>
                        <th>تحقق %</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topKpis.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-muted">
                            لا بيانات
                          </td>
                        </tr>
                      ) : (
                        topKpis.map((k) => (
                          <tr key={k.kpiId}>
                            <td dir="ltr">{k.code}</td>
                            <td>{k.name}</td>
                            <td>{k.departmentName || "—"}</td>
                            <td dir="ltr">{k.achievementPct ?? "—"}</td>
                            <td>{STATUS_LABEL[k.status as keyof typeof STATUS_LABEL] || k.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {current === "distribution" ? (
              <div>
                <h2 className="zrp-slide-title">توزيع الحالات</h2>
                <div className="zrp-kpis">
                  {statusRows.map(([label, value]) => (
                    <div key={label} className="zad-kpi">
                      <div className="zad-kpi__label">{label}</div>
                      <div className="zad-kpi__value">{value}</div>
                    </div>
                  ))}
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
                        <span>{k.code}</span>
                        <strong dir="ltr">{k.achievementPct ?? 0}%</strong>
                      </div>
                      <div className="zad-progress">
                        <div className="zad-progress__track">
                          <span
                            className="zad-progress__bar"
                            style={{
                              width: `${Math.min(100, Math.max(0, k.achievementPct ?? 0))}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-muted" style={{ fontSize: "var(--text-xs)" }}>
                        {k.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {current === "departments" ? (
              <div>
                <h2 className="zrp-slide-title">أداء الإدارات</h2>
                <div className="zad-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>الإدارة</th>
                        <th>عدد المؤشرات</th>
                        <th>متوسط التحقق %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.byDepartment ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-muted">
                            لا بيانات
                          </td>
                        </tr>
                      ) : (
                        data.byDepartment.map((d) => (
                          <tr key={d.name}>
                            <td>{d.name}</td>
                            <td dir="ltr">{d.count}</td>
                            <td dir="ltr">{d.avgAchievement ?? "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {current === "closing" ? (
              <div className="zrp-slide-center">
                <div className="zrp-accent-bar" />
                <h1 className="zrp-cover-title">{closingTitle}</h1>
                <p className="zrp-cover-period">{periodDisplay}</p>
                <p className="zrp-cover-meta">يُعتمد العرض على القيم النهائية فقط</p>
              </div>
            ) : null}
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
