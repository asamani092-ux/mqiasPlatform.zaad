"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Save, Send } from "lucide-react";
import { toast } from "sonner";
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
    suggestedWording?: string | null;
    evidences: { id: number; fileName: string; status?: string; rejectReason?: string | null }[];
  } | null;
  kpis: { id: number; code: string; type: string; name: string }[];
  periods: Period[];
};

function isLocked(status?: string | null) {
  return status === "FINAL_APPROVED" || status === "APPROVED" || status === "INITIAL_APPROVED";
}

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
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setDrafts(buildDrafts(initialItems));
  }, [initialItems]);

  async function reload() {
    const res = await fetch(`/api/my/measurements?year=${year}&period=${period}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items as MeasurementItem[]);
      setDrafts(buildDrafts(data.items));
    }
    router.refresh();
  }

  async function save(requirementId: number, action: "draft" | "submit") {
    const draft = drafts[requirementId];
    if (!draft?.actual) {
      toast.error("أدخل القيمة الفعلية");
      return;
    }
    setSaving(requirementId);
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
        action,
      }),
    });
    setSaving(null);
    if (res.ok) {
      toast.success(action === "draft" ? "تم حفظ المسودة" : "تم تقديم القياس لمراجعة الإدارة");
      await reload();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "فشل الحفظ");
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
      toast.success("تم رفع الشاهد");
      await reload();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "فشل الرفع");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>شواهد المؤشرات</h1>
          <div className="text-muted">أدخل المتحقق وارفع الشواهد ثم قدّم لمراجعة مدير الإدارة</div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      {items.length === 0 ? (
        <div className="card">
          <p className="text-muted">لا توجد متطلبات مسندة لك لهذه الفترة.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>الرمز</th>
                <th>المتطلب</th>
                <th>المؤشرات</th>
                <th>المتحقق</th>
                <th>الحالة</th>
                <th>الشواهد</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const draft = drafts[item.requirement.id] ?? { actual: "", what: "", how: "" };
                const isExpanded = expanded === item.requirement.id;
                const locked = isLocked(item.measurement?.approvalStatus);

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
                                  `${k.code} (${TYPE_LABEL[k.type as keyof typeof TYPE_LABEL] ?? k.type})`
                              )
                              .join(" · ")}
                      </td>
                      <td>
                        <input
                          className="input-field"
                          style={{ width: 88 }}
                          type="number"
                          step="any"
                          value={draft.actual}
                          disabled={locked}
                          onChange={(e) =>
                            setDrafts((d) => ({
                              ...d,
                              [item.requirement.id]: { ...draft, actual: e.target.value },
                            }))
                          }
                        />
                        <span className="text-muted" style={{ marginInlineStart: ".25rem", fontSize: ".75rem" }}>
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
                            {item.measurement.evidences.filter((e) => e.status !== "REJECTED").length}
                            {!locked && (
                              <label
                                className="btn-secondary btn-sm"
                                style={{ marginInlineStart: ".3rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: ".2rem" }}
                              >
                                <Plus {...ICON_PROPS} />
                                <input
                                  type="file"
                                  hidden
                                  accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) void uploadEvidence(item.measurement!.id, f);
                                  }}
                                />
                              </label>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          disabled={saving === item.requirement.id || locked}
                          onClick={() => void save(item.requirement.id, "draft")}
                          title="حفظ مسودة"
                        >
                          <Save {...ICON_PROPS} />
                        </button>
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          disabled={saving === item.requirement.id || locked}
                          onClick={() => void save(item.requirement.id, "submit")}
                          title="تقديم للمراجعة"
                        >
                          <Send {...ICON_PROPS} />
                          {saving === item.requirement.id ? "..." : "تقديم"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => setExpanded(isExpanded ? null : item.requirement.id)}
                          aria-label={isExpanded ? "طي" : "تفاصيل"}
                        >
                          {isExpanded ? <ChevronUp {...ICON_PROPS} /> : <ChevronDown {...ICON_PROPS} />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ background: "var(--tmkeen-surface-muted)" }}>
                          {(item.measurement?.approvalStatus === "REJECTED_WORDING" ||
                            item.measurement?.approvalStatus === "REJECTED_EVIDENCE" ||
                            item.measurement?.approvalStatus === "REJECTED") && (
                            <div className="alert alert-warn" style={{ marginBottom: ".75rem" }}>
                              {item.measurement.rejectReason && (
                                <div>سبب الرفض: {item.measurement.rejectReason}</div>
                              )}
                              {item.measurement.suggestedWording && (
                                <div style={{ marginTop: ".35rem" }}>
                                  الصياغة المقترحة: {item.measurement.suggestedWording}
                                </div>
                              )}
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
                                  {POLARITY_LABEL[item.requirement.polarity] || item.requirement.polarity}
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
                                    disabled={locked}
                                    onChange={(e) =>
                                      setDrafts((d) => ({
                                        ...d,
                                        [item.requirement.id]: { ...draft, what: e.target.value },
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
                                    disabled={locked}
                                    onChange={(e) =>
                                      setDrafts((d) => ({
                                        ...d,
                                        [item.requirement.id]: { ...draft, how: e.target.value },
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
                              className={ev.status === "REJECTED" ? "badge-danger" : "badge-primary"}
                              style={{ marginInlineStart: ".4rem", display: "inline-block", marginTop: ".4rem" }}
                              title={ev.rejectReason || undefined}
                            >
                              {ev.fileName}
                              {ev.status === "REJECTED" ? " (مرفوض)" : ""}
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
