"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Save, Send } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import ActionToolbar, { IconActionButton } from "@/components/ui/ActionToolbar";
import {
  APPROVAL_BADGE,
  POLARITY_LABEL,
  type Period,
} from "@/lib/types";
import { TYPE_LABEL } from "@/lib/kpi-schemas";
import { canFillerEdit, displayApprovalLabel } from "@/lib/approval-status";
import { notifyToast } from "@/lib/ui-toast";
import { ICON_PROPS } from "@/lib/icon-props";
import { FIELD_LABELS, type FieldKey, type ReviewFeedback } from "@/lib/review-feedback";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import EvidenceDropzone from "@/components/ui/EvidenceDropzone";
import EmptyState from "@/components/ui/EmptyState";
import Chip from "@/components/ui/Chip";

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
    departmentName?: string | null;
    sectionName?: string | null;
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
    reviewFeedback?: unknown;
    evidences: { id: number; fileName: string; status?: string; rejectReason?: string | null }[];
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
  const searchParams = useSearchParams();
  const year = initialYear;
  const period = initialPeriod;
  const [items, setItems] = useState(initialItems);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [drafts, setDrafts] = useState(() => buildDrafts(initialItems));
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setDrafts(buildDrafts(initialItems));
  }, [initialItems]);

  useEffect(() => {
    const mp = searchParams.get("mp");
    if (!mp) return;
    const id = parseInt(mp, 10);
    if (Number.isNaN(id)) return;
    const hit = initialItems.find((it) => it.measurement?.id === id);
    if (hit) {
      setExpanded(hit.requirement.id);
      requestAnimationFrame(() => {
        document.getElementById(`req-row-${hit.requirement.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }, [searchParams, initialItems]);

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
      notifyToast.error("أدخل القيمة الفعلية");
      return;
    }
    if (action === "submit") {
      const item = items.find((it) => it.requirement.id === requirementId);
      const activeCount =
        item?.measurement?.evidences.filter((e) => e.status !== "REJECTED").length ?? 0;
      if (!item?.measurement || activeCount < 1) {
        notifyToast.error("احفظ مسودة وارفع شاهدًا واحدًا على الأقل قبل التقديم");
        return;
      }
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
      const data = await res.json().catch(() => ({}));
      notifyToast.success(
        action === "draft"
          ? "تم حفظ المسودة"
          : data.message ||
              (data.skipDeptInitial
                ? "قُدِّم مباشرة للاعتماد النهائي"
                : "تم تقديم القياس لمراجعة الإدارة"),
        { duration: action === "submit" ? "normal" : "short" }
      );
      await reload();
    } else {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل الحفظ");
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
      notifyToast.success("تم رفع الشاهد — إن كان مرفوضاً اضغط إعادة التقديم", {
        duration: "normal",
      });
      await reload();
    } else {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل الرفع");
    }
  }

  async function softDeleteEvidence(measurementPeriodId: number, evidenceId: number) {
    if (!window.confirm("حذف هذا الشاهد من القائمة؟ (يُحفظ السجل ولا يُتلف الملف)")) return;
    const res = await fetch(
      `/api/my/measurements/${measurementPeriodId}/evidence?evidenceId=${evidenceId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      notifyToast.success("أُزيل الشاهد", { duration: "short" });
      await reload();
    } else {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل الحذف");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <PageBreadcrumb items={[{ label: "شواهد المؤشرات" }]} />
          <h1>شواهد المؤشرات</h1>
          <div className="text-muted">
            مهامك المسندة فقط — المسؤول: أنت · أدخل المتحقق وارفع الشواهد ثم قدّم
          </div>
        </div>
        <PeriodSelector year={year} period={period} />
      </div>

      {items.some(
        (it) =>
          it.measurement?.approvalStatus === "REJECTED_EVIDENCE" ||
          it.measurement?.approvalStatus === "REJECTED_WORDING" ||
          it.measurement?.approvalStatus === "REJECTED"
      ) ? (
        <div className="alert alert-warn" style={{ marginBottom: "1rem" }}>
          لديك قياسات مرفوضة — صحّح الحقول/الشواهد حسب ملاحظات القسم ثم اضغط{" "}
          <strong>إعادة التقديم</strong> لإعادتها إلى مسار الاعتماد. رفع شاهد بديل وحده لا يكفي.
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="لا مهام مسندة"
          body="راجع مدير الإدارة أو إسناد المسؤولين لتعيين مؤشرات لك."
        />
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>الرمز</th>
                <th>المتطلب</th>
                <th>الإدارة</th>
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
                const status = item.measurement?.approvalStatus ?? "DRAFT";
                const locked = item.measurement
                  ? !canFillerEdit(status as never)
                  : false;
                const label = displayApprovalLabel(status, item.measurement?.rejectReason);
                const showReturnAlert =
                  !!item.measurement?.rejectReason &&
                  (status === "DRAFT" ||
                    status === "SUBMITTED" ||
                    status === "PENDING" ||
                    status === "REJECTED_WORDING" ||
                    status === "REJECTED_EVIDENCE" ||
                    status === "REJECTED");

                return (
                  <Fragment key={item.requirement.id}>
                    <tr id={`req-row-${item.requirement.id}`}>
                      <td>{item.requirement.code}</td>
                      <td>
                        {item.requirement.name}
                        <div className="text-muted" style={{ fontSize: ".75rem" }}>
                          المسؤول: أنت
                        </div>
                        {showReturnAlert && !isExpanded ? (
                          <button
                            type="button"
                            className="badge-warning"
                            style={{ marginTop: ".25rem", border: 0, cursor: "pointer" }}
                            onClick={() => setExpanded(item.requirement.id)}
                          >
                            ملاحظات القسم
                          </button>
                        ) : null}
                      </td>
                      <td style={{ fontSize: ".8rem" }}>
                        {item.requirement.departmentName || "—"}
                        {item.requirement.sectionName
                          ? ` · ${item.requirement.sectionName}`
                          : ""}
                      </td>
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
                        <span className={APPROVAL_BADGE[status] || "badge-neutral"}>{label}</span>
                      </td>
                      <td>
                        {item.measurement ? (
                          <>
                            {item.measurement.evidences.filter((e) => e.status !== "REJECTED").length}
                            {!locked && (
                              <label
                                className="icon-btn icon-btn--sm"
                                style={{ marginInlineStart: ".3rem", cursor: "pointer" }}
                                title="رفع شاهد"
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
                      <td>
                        <ActionToolbar>
                          <IconActionButton
                            icon={Save}
                            label="حفظ مسودة"
                            disabled={saving === item.requirement.id || locked}
                            onClick={() => void save(item.requirement.id, "draft")}
                          />
                          <IconActionButton
                            icon={Send}
                            label={
                              status === "REJECTED_EVIDENCE" ||
                              status === "REJECTED_WORDING" ||
                              status === "REJECTED"
                                ? "إعادة التقديم"
                                : "تقديم للمراجعة"
                            }
                            variant="primary"
                            showLabel
                            disabled={
                              saving === item.requirement.id ||
                              locked ||
                              !item.measurement ||
                              item.measurement.evidences.filter((e) => e.status !== "REJECTED")
                                .length < 1
                            }
                            title={
                              !item.measurement ||
                              item.measurement.evidences.filter((e) => e.status !== "REJECTED")
                                .length < 1
                                ? "ارفع شاهدًا نشطًا واحدًا على الأقل قبل التقديم"
                                : undefined
                            }
                            onClick={() => void save(item.requirement.id, "submit")}
                          />
                          <IconActionButton
                            icon={isExpanded ? ChevronUp : ChevronDown}
                            label={isExpanded ? "طي" : "تفاصيل"}
                            onClick={() => setExpanded(isExpanded ? null : item.requirement.id)}
                          />
                        </ActionToolbar>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} style={{ background: "var(--tmkeen-surface-muted)" }}>
                          {showReturnAlert && (
                            <div className="alert alert-warn" style={{ marginBottom: ".75rem" }}>
                              <div>
                                <strong>ملاحظات القسم / المشرف: </strong>
                                {item.measurement!.rejectReason}
                              </div>
                              {typeof item.measurement!.reviewFeedback === "object" &&
                              item.measurement!.reviewFeedback != null ? (
                                <ul style={{ margin: ".4rem 0 0", paddingInlineStart: "1.1rem" }}>
                                  {Object.entries(
                                    (item.measurement!.reviewFeedback as ReviewFeedback).fields || {}
                                  ).map(([key]) => (
                                    <li key={key}>
                                      رُفض الحقل: {FIELD_LABELS[key as FieldKey] || key}
                                    </li>
                                  ))}
                                  {(
                                    (item.measurement!.reviewFeedback as ReviewFeedback).evidences || []
                                  ).map((ev) => (
                                    <li key={ev.evidenceId}>
                                      رُفض شاهد: {ev.fileName || ev.evidenceId}
                                      {ev.reason ? ` — ${ev.reason}` : ""}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              {item.measurement!.suggestedWording && (
                                <div style={{ marginTop: ".35rem" }}>
                                  الصياغة المقترحة: {item.measurement!.suggestedWording}
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
                          <div className="filter-bar-chips" style={{ marginBlock: "var(--space-3)" }}>
                            {item.measurement?.evidences.map((ev) => (
                              <Chip
                                key={ev.id}
                                label={ev.fileName}
                                tone="brand"
                                onRemove={
                                  !locked
                                    ? () => void softDeleteEvidence(item.measurement!.id, ev.id)
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                          {!locked && item.measurement ? (
                            <EvidenceDropzone
                              onFile={(f) => void uploadEvidence(item.measurement!.id, f)}
                            />
                          ) : null}
                          {(status === "REJECTED_EVIDENCE" ||
                            status === "REJECTED_WORDING" ||
                            status === "REJECTED") &&
                          !locked ? (
                            <div style={{ marginTop: ".75rem" }}>
                              <button
                                type="button"
                                className="btn-primary btn-sm"
                                disabled={
                                  saving === item.requirement.id ||
                                  item.measurement!.evidences.filter((e) => e.status !== "REJECTED")
                                    .length < 1
                                }
                                title={
                                  item.measurement!.evidences.filter((e) => e.status !== "REJECTED")
                                    .length < 1
                                    ? "ارفع شاهدًا نشطًا واحدًا على الأقل قبل التقديم"
                                    : undefined
                                }
                                onClick={() => void save(item.requirement.id, "submit")}
                              >
                                إعادة التقديم بعد التصحيح
                              </button>
                            </div>
                          ) : null}
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
