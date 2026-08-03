"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
  };
  kpis: ReportKpi[];
};

export default function AdminReportClient() {
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/report");
    if (res.ok) {
      setData(await res.json());
    } else {
      notifyToast.error("تعذر تحميل بيانات التقرير");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const slidesCount = 4;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>تقرير العرض التقديمي</h1>
          <div className="text-muted">
            نموذج Apps Script المعتمد · بيانات FINAL_APPROVED لجولة القياس
          </div>
        </div>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <Link className="btn-secondary btn-sm" href="/admin/settings">
            إعدادات الجولة
          </Link>
          <a
            className="btn-secondary btn-sm"
            href="/docs/reports/strategic-performance-deck.html"
            target="_blank"
            rel="noreferrer"
          >
            النموذج الثابت
          </a>
          <button type="button" className="btn-primary btn-sm" onClick={() => window.print()}>
            طباعة / تصدير
          </button>
        </div>
      </div>

      {loading || !data ? (
        <p className="text-muted">جاري التحميل...</p>
      ) : (
        <>
          <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
            الجولة: {PERIOD_LABEL[data.period as Period] || data.periodLabel} {data.year} ·{" "}
            {data.summary.measured} مؤشرًا معتمدًا نهائيًا
          </div>

          <div
            className="report-deck-toolbar"
            style={{ display: "flex", gap: ".75rem", marginBottom: "1rem", flexWrap: "wrap" }}
          >
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setSlide((s) => (s - 1 + slidesCount) % slidesCount)}
            >
              السابق
            </button>
            <span className="text-muted">
              شريحة {slide + 1} / {slidesCount}
            </span>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setSlide((s) => (s + 1) % slidesCount)}
            >
              التالي
            </button>
          </div>

          <div
            className="report-deck-stage card"
            style={{
              minHeight: 420,
              background:
                "linear-gradient(145deg, #fff8ef 0%, #f6e7d2 55%, #f0d9c4 100%)",
              border: "3px solid #e9b221",
              padding: "1.5rem",
            }}
          >
            {slide === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <div style={{ color: "#951740", fontWeight: 800, letterSpacing: ".06em" }}>مِقياس</div>
                <h2 style={{ color: "#6e1030", fontSize: "2rem", margin: ".75rem 0" }}>
                  تقرير الأداء الاستراتيجي
                </h2>
                <div
                  style={{
                    width: 140,
                    height: 5,
                    margin: "0 auto 1rem",
                    background: "#e9b221",
                    borderRadius: 99,
                  }}
                />
                <p className="text-muted">
                  {data.periodLabel} {data.year} — القيم المعتمدة نهائيًا فقط
                </p>
              </div>
            ) : null}

            {slide === 1 ? (
              <div>
                <h2 style={{ color: "#951740" }}>ملخص الجولة</h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  {[
                    ["مؤشرات معتمدة", data.summary.measured],
                    ["متوسط التحقق %", data.summary.avgAchievement ?? "—"],
                    ["حرج / خطر", data.summary.atRisk],
                    ["متحقق ≥100%", data.summary.achieved],
                  ].map(([label, value]) => (
                    <div key={String(label)} style={{ background: "#fff", padding: "1rem", borderRadius: 12 }}>
                      <div className="text-muted">{label}</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#951740" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {slide === 2 ? (
              <div>
                <h2 style={{ color: "#951740" }}>أبرز المؤشرات</h2>
                <div className="table-wrap" style={{ marginTop: "1rem" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>الرمز</th>
                        <th>المؤشر</th>
                        <th>الإدارة</th>
                        <th>مستهدف</th>
                        <th>متحقق</th>
                        <th>تحقق %</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.kpis.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-muted">
                            لا بيانات معتمدة نهائيًا لهذه الجولة
                          </td>
                        </tr>
                      ) : (
                        data.kpis.slice(0, 20).map((k) => (
                          <tr key={k.kpiId}>
                            <td>{k.code}</td>
                            <td>{k.name}</td>
                            <td>{k.departmentName || "—"}</td>
                            <td>{k.target ?? "—"}</td>
                            <td>{k.actual ?? "—"}</td>
                            <td>{k.achievementPct ?? "—"}</td>
                            <td>
                              {STATUS_LABEL[k.status as keyof typeof STATUS_LABEL] || k.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {slide === 3 ? (
              <div>
                <h2 style={{ color: "#951740" }}>خاتمة وتوصيات</h2>
                <p>يُعتمد العرض على القيم النهائية فقط. إلغاء الاعتماد النهائي يزيل المؤشر من التحليل حتى إعادة الاعتماد.</p>
                <p>بعد اكتمال الاعتماد يُفضَّل إغلاق الجولة من الإعدادات ومتابعة الإغلاق من تبويب الاعتماد النهائي.</p>
              </div>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}
