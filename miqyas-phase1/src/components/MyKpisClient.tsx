"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  PERIOD_LABEL,
  STATUS_LABEL,
  STATUS_BADGE,
  APPROVAL_LABEL,
  APPROVAL_BADGE,
  POLARITY_LABEL,
  type Period,
  type KpiStatus,
} from "@/lib/types";

type KpiItem = {
  kpi: {
    id: number;
    code: string;
    name: string;
    unit: string;
    baseline: number | null;
    annualTarget: number | null;
    polarity: string;
    frequency: string;
    requiredData: string | null;
    ownerId: number | null;
  };
  target: { targetValue: number } | null;
  entry: {
    id: number;
    actualValue: number;
    achievementPct: number | null;
    deviationValue: number | null;
    deviationPct: number | null;
    status: KpiStatus;
    whatHappened: string | null;
    howHappened: string | null;
    recommendation: string | null;
    approvalStatus: string;
    rejectReason: string | null;
    evidences: { id: number; fileName: string }[];
  } | null;
  periods: Period[];
};

function calcLivePct(actual: number, target: number, polarity: string): number | null {
  if (!target) return null;
  if (polarity === "LOWER_BETTER") {
    if (!actual) return null;
    return Math.round((target / actual) * 1000) / 10;
  }
  return Math.round((actual / target) * 1000) / 10;
}

function calcLiveStatus(pct: number | null): KpiStatus {
  if (pct === null) return "NO_DATA";
  if (pct >= 100) return "ACHIEVED";
  if (pct >= 80) return "ON_TRACK";
  if (pct >= 60) return "AT_RISK";
  return "CRITICAL";
}

function buildDrafts(list: KpiItem[]) {
  const d: Record<number, { actual: string; what: string; how: string }> = {};
  for (const item of list) {
    d[item.kpi.id] = {
      actual: item.entry?.actualValue?.toString() ?? "",
      what: item.entry?.whatHappened ?? "",
      how: item.entry?.howHappened ?? "",
    };
  }
  return d;
}

export default function MyKpisClient({
  initialYear,
  initialPeriod,
  initialItems,
}: {
  initialYear: number;
  initialPeriod: Period;
  initialItems: KpiItem[];
}) {
  const [year, setYear] = useState(initialYear);
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [items, setItems] = useState<KpiItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [drafts, setDrafts] = useState(() => buildDrafts(initialItems));
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/my/entries?year=${year}&period=${period}`);
    if (res.ok) {
      const data = await res.json();
      const owned = data.items as KpiItem[];
      setItems(owned);
      const d: Record<number, { actual: string; what: string; how: string }> = {};
      for (const item of owned) {
        d[item.kpi.id] = {
          actual: item.entry?.actualValue?.toString() ?? "",
          what: item.entry?.whatHappened ?? "",
          how: item.entry?.howHappened ?? "",
        };
      }
      setDrafts(d);
    }
    setLoading(false);
  }, [year, period]);

  useEffect(() => {
    if (year === initialYear && period === initialPeriod) {
      setItems(initialItems);
      setDrafts(buildDrafts(initialItems));
      return;
    }
    load();
  }, [year, period, initialYear, initialPeriod, initialItems, load]);

  async function save(kpiId: number) {
    const draft = drafts[kpiId];
    if (!draft) return;
    setSaving(kpiId);
    setMsg("");
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kpiId,
        year,
        period,
        actualValue: parseFloat(draft.actual),
        whatHappened: draft.what || null,
        howHappened: draft.how || null,
      }),
    });
    setSaving(null);
    if (res.ok) {
      setMsg("تم حفظ القياس بنجاح — بانتظار الاعتماد");
      await load();
    } else {
      const err = await res.json();
      setMsg(err.error || "فشل الحفظ");
    }
  }

  async function uploadEvidence(entryId: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/entries/${entryId}/evidence`, { method: "POST", body: fd });
    if (res.ok) {
      setMsg("تم رفع الشاهد بنجاح");
      await load();
    } else {
      const err = await res.json();
      setMsg(err.error || "فشل الرفع");
    }
  }

  const allPeriods: Period[] = ["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>مهامي ومؤشراتي</h1>
          <div className="text-muted">إدخال المتحقق الفعلي والشواهد للفترة المحددة</div>
        </div>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
          <select className="input-field" style={{ width: "auto" }} value={year} onChange={(e) => setYear(+e.target.value)}>
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select className="input-field" style={{ width: "auto" }} value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            {allPeriods.map((p) => (
              <option key={p} value={p}>{PERIOD_LABEL[p]}</option>
            ))}
          </select>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.includes("نجاح") || msg.includes("رفع") ? "alert-success" : "alert-error"}`} style={{ marginBottom: "1rem" }}>
          {msg}
        </div>
      )}

      {loading ? (
        <p className="text-muted">جاري التحميل...</p>
      ) : items.length === 0 ? (
        <div className="card"><p className="text-muted">لا توجد مؤشرات مسندة لك لهذه الفترة.</p></div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>رمز</th>
                <th>اسم المؤشر</th>
                <th>البيانات المطلوبة</th>
                <th>خط الأساس</th>
                <th>المستهدف</th>
                <th>المتحقق</th>
                <th>نسبة الإنجاز</th>
                <th>الحالة</th>
                <th>الاعتماد</th>
                <th>الشواهد</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const draft = drafts[item.kpi.id] ?? { actual: "", what: "", how: "" };
                const targetVal = item.target?.targetValue ?? 0;
                const livePct = calcLivePct(parseFloat(draft.actual) || 0, targetVal, item.kpi.polarity);
                const liveStatus = calcLiveStatus(livePct);
                const isExpanded = expanded === item.kpi.id;

                return (
                  <Fragment key={item.kpi.id}>
                    <tr>
                      <td>{item.kpi.code}</td>
                      <td>{item.kpi.name}</td>
                      <td style={{ maxWidth: 160, fontSize: ".75rem" }}>{item.kpi.requiredData || "—"}</td>
                      <td>{item.kpi.baseline ?? "—"}</td>
                      <td>{item.target ? `${item.target.targetValue} ${item.kpi.unit}` : "—"}</td>
                      <td>
                        <input
                          className="input-field"
                          style={{ width: 80 }}
                          type="number"
                          step="any"
                          value={draft.actual}
                          disabled={item.entry?.approvalStatus === "APPROVED"}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [item.kpi.id]: { ...draft, actual: e.target.value } }))
                          }
                        />
                      </td>
                      <td>{livePct != null ? `${livePct}%` : "—"}</td>
                      <td>
                        <span className={STATUS_BADGE[liveStatus]}>{STATUS_LABEL[liveStatus]}</span>
                      </td>
                      <td>
                        {item.entry ? (
                          <span className={APPROVAL_BADGE[item.entry.approvalStatus]}>
                            {APPROVAL_LABEL[item.entry.approvalStatus]}
                          </span>
                        ) : (
                          <span className="badge-neutral">جديد</span>
                        )}
                      </td>
                      <td>
                        {item.entry ? (
                          <>
                            {item.entry.evidences.length}
                            {item.entry.approvalStatus !== "APPROVED" && (
                              <label className="btn-secondary btn-sm" style={{ marginRight: ".3rem", cursor: "pointer" }}>
                                +
                                <input
                                  type="file"
                                  hidden
                                  accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) uploadEvidence(item.entry!.id, f);
                                  }}
                                />
                              </label>
                            )}
                          </>
                        ) : "—"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          disabled={saving === item.kpi.id || item.entry?.approvalStatus === "APPROVED"}
                          onClick={() => save(item.kpi.id)}
                        >
                          {saving === item.kpi.id ? "..." : "حفظ"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          style={{ marginRight: ".3rem" }}
                          onClick={() => setExpanded(isExpanded ? null : item.kpi.id)}
                        >
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={11} style={{ background: "var(--tmkeen-surface-muted)" }}>
                          {item.entry?.approvalStatus === "REJECTED" && item.entry.rejectReason && (
                            <div className="alert alert-warn" style={{ marginBottom: ".75rem" }}>
                              سبب الرفض: {item.entry.rejectReason}
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: ".75rem" }}>
                            <div>
                              <label className="label-field">ماذا حصل؟</label>
                              <textarea
                                className="input-field"
                                rows={3}
                                value={draft.what}
                                disabled={item.entry?.approvalStatus === "APPROVED"}
                                onChange={(e) =>
                                  setDrafts((d) => ({ ...d, [item.kpi.id]: { ...draft, what: e.target.value } }))
                                }
                              />
                            </div>
                            <div>
                              <label className="label-field">كيف حصل؟</label>
                              <textarea
                                className="input-field"
                                rows={3}
                                value={draft.how}
                                disabled={item.entry?.approvalStatus === "APPROVED"}
                                onChange={(e) =>
                                  setDrafts((d) => ({ ...d, [item.kpi.id]: { ...draft, how: e.target.value } }))
                                }
                              />
                            </div>
                          </div>
                          <div className="text-muted" style={{ fontSize: ".72rem" }}>
                            الاتجاه: {POLARITY_LABEL[item.kpi.polarity] || item.kpi.polarity}
                            {item.entry?.recommendation && ` · التوصية: ${item.entry.recommendation}`}
                          </div>
                          {item.entry?.evidences.map((ev) => (
                            <a
                              key={ev.id}
                              href={`/api/evidence/${ev.id}`}
                              className="badge-primary"
                              style={{ marginLeft: ".4rem", display: "inline-block", marginTop: ".4rem" }}
                            >
                              {ev.fileName}
                            </a>
                          ))}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
