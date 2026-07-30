"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import {
  APPROVAL_LABEL,
  APPROVAL_BADGE,
  POLARITY_LABEL,
  type Period,
} from "@/lib/types";
import { TYPE_LABEL } from "@/lib/kpi-schemas";
import { ICON_PROPS } from "@/lib/icon-props";

type MeasurementItem = {
  requirement: {
    id: number;
    code: string;
    name: string;
    unit: string;
    polarity: string;
    frequency: string;
    requiredData: string | null;
    ownerId: number | null;
  };
  measurement: {
    id: number;
    actualValue: number;
    whatHappened: string | null;
    howHappened: string | null;
    note: string | null;
    approvalStatus: string;
    rejectReason: string | null;
    evidences: { id: number; fileName: string }[];
  } | null;
  kpis: { id: number; code: string; type: string; name: string }[];
  periods: Period[];
};

function buildDrafts(list: MeasurementItem[]) {
  const d: Record<number, { actual: string; what: string; how: string }> = {};
  for (const item of list) {
    d[item.requirement.id] = {
      actual: item.measurement?.actualValue?.toString() ?? "",
      what: item.measurement?.whatHappened ?? "",
      how: item.measurement?.howHappened ?? "",
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
  initialItems: MeasurementItem[];
}) {
  const router = useRouter();
  const year = initialYear;
  const period = initialPeriod;
  const [items, setItems] = useState<MeasurementItem[]>(initialItems);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [drafts, setDrafts] = useState(() => buildDrafts(initialItems));
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setDrafts(buildDrafts(initialItems));
  }, [initialItems]);

  async function reload() {
    const res = await fetch(`/api/my/measurements?year=${year}&period=${period}`);
    if (res.ok) {
      const data = await res.json();
      const owned = data.items as MeasurementItem[];
      setItems(owned);
      setDrafts(buildDrafts(owned));
    }
    router.refresh();
  }

  async function save(requirementId: number) {
    const draft = drafts[requirementId];
    if (!draft) return;
    setSaving(requirementId);
    setMsg("");
    const res = await fetch("/api/my/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementId,
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
      await reload();
    } else {
      const err = await res.json();
      setMsg(err.error || "فشل الحفظ");
    }
  }

  async function uploadEvidence(measurementPeriodId: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/my/measurements/${measurementPeriodId}/evidence`, {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      setMsg("تم رفع الشاهد بنجاح");
      await reload();
    } else {
      const err = await res.json();
      setMsg(err.error || "فشل الرفع");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>متطلبات القياس</h1>
          <div className="text-muted">إدخال المتحقق الفعلي والشواهد للفترة المحددة</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      {msg && (
        <div
          className={`alert ${msg.includes("نجاح") || msg.includes("رفع") ? "alert-success" : "alert-error"}`}
          style={{ marginBottom: "1rem" }}
        >
          {msg}
        </div>
      )}

      {items.length === 0 ? (
        <div className="card">
          <p className="text-muted">لا توجد متطلبات مسندة لك لهذه الفترة.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>رمز المتطلب</th>
                <th>المتطلب</th>
                <th>المؤشرات المرتبطة</th>
                <th>البيانات المطلوبة</th>
                <th>المتحقق</th>
                <th>الاعتماد</th>
                <th>الشواهد</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const draft = drafts[item.requirement.id] ?? { actual: "", what: "", how: "" };
                const isExpanded = expanded === item.requirement.id;
                const approved = item.measurement?.approvalStatus === "APPROVED";

                return (
                  <Fragment key={item.requirement.id}>
                    <tr>
                      <td>{item.requirement.code}</td>
                      <td>{item.requirement.name}</td>
                      <td style={{ fontSize: ".75rem" }}>
                        {item.kpis.length === 0
                          ? "—"
                          : item.kpis
                              .map(
                                (k) =>
                                  `${k.code} (${TYPE_LABEL[k.type as keyof typeof TYPE_LABEL] ?? k.type})`,
                              )
                              .join(" · ")}
                      </td>
                      <td style={{ maxWidth: 160, fontSize: ".75rem" }}>
                        {item.requirement.requiredData || "—"}
                      </td>
                      <td>
                        <input
                          className="input-field"
                          style={{ width: 80 }}
                          type="number"
                          step="any"
                          value={draft.actual}
                          disabled={approved}
                          onChange={(e) =>
                            setDrafts((d) => ({
                              ...d,
                              [item.requirement.id]: { ...draft, actual: e.target.value },
                            }))
                          }
                        />
                        <span
                          className="text-muted"
                          style={{ marginInlineStart: ".25rem", fontSize: ".75rem" }}
                        >
                          {item.requirement.unit}
                        </span>
                      </td>
                      <td>
                        {item.measurement ? (
                          <span className={APPROVAL_BADGE[item.measurement.approvalStatus]}>
                            {APPROVAL_LABEL[item.measurement.approvalStatus]}
                          </span>
                        ) : (
                          <span className="badge-neutral">جديد</span>
                        )}
                      </td>
                      <td>
                        {item.measurement ? (
                          <>
                            {item.measurement.evidences.length}
                            {!approved && (
                              <label
                                className="btn-secondary btn-sm"
                                style={{
                                  marginInlineStart: ".3rem",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: ".2rem",
                                }}
                              >
                                <Plus {...ICON_PROPS} />
                                <input
                                  type="file"
                                  hidden
                                  accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) uploadEvidence(item.measurement!.id, f);
                                  }}
                                />
                              </label>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          disabled={saving === item.requirement.id || approved}
                          onClick={() => save(item.requirement.id)}
                        >
                          {saving === item.requirement.id ? "..." : "حفظ"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          style={{
                            marginInlineStart: ".3rem",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                          onClick={() =>
                            setExpanded(isExpanded ? null : item.requirement.id)
                          }
                          aria-label={isExpanded ? "طي التفاصيل" : "عرض التفاصيل"}
                        >
                          {isExpanded ? (
                            <ChevronUp {...ICON_PROPS} />
                          ) : (
                            <ChevronDown {...ICON_PROPS} />
                          )}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} style={{ background: "var(--tmkeen-surface-muted)" }}>
                          {item.measurement?.approvalStatus === "REJECTED" &&
                            item.measurement.rejectReason && (
                              <div className="alert alert-warn" style={{ marginBottom: ".75rem" }}>
                                سبب الرفض: {item.measurement.rejectReason}
                              </div>
                            )}
                          <div className="field-grid" style={{ marginBottom: ".75rem" }}>
                            <div className="field-cell">
                              <div className="field-cell-row">
                                <span className="field-cell-label">البيانات المطلوبة</span>
                                <span className="field-cell-value">
                                  {item.requirement.requiredData || "—"}
                                </span>
                              </div>
                            </div>
                            <div className="field-cell">
                              <div className="field-cell-row">
                                <span className="field-cell-label">الاتجاه</span>
                                <span className="field-cell-value">
                                  {POLARITY_LABEL[item.requirement.polarity] ||
                                    item.requirement.polarity}
                                </span>
                              </div>
                            </div>
                            <div className="field-cell">
                              <div className="field-cell-row">
                                <span className="field-cell-label">ماذا حصل؟</span>
                                <div className="field-cell-control">
                                  <textarea
                                    className="input-field"
                                    rows={3}
                                    value={draft.what}
                                    disabled={approved}
                                    onChange={(e) =>
                                      setDrafts((d) => ({
                                        ...d,
                                        [item.requirement.id]: {
                                          ...draft,
                                          what: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="field-cell">
                              <div className="field-cell-row">
                                <span className="field-cell-label">كيف حصل؟</span>
                                <div className="field-cell-control">
                                  <textarea
                                    className="input-field"
                                    rows={3}
                                    value={draft.how}
                                    disabled={approved}
                                    onChange={(e) =>
                                      setDrafts((d) => ({
                                        ...d,
                                        [item.requirement.id]: {
                                          ...draft,
                                          how: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          {item.measurement?.evidences.map((ev) => (
                            <a
                              key={ev.id}
                              href={`/api/evidence/${ev.id}`}
                              className="badge-primary"
                              style={{
                                marginInlineStart: ".4rem",
                                display: "inline-block",
                                marginTop: ".4rem",
                              }}
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
