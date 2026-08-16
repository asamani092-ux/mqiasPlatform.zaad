"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ClipboardCheck, Copy, ExternalLink, RotateCcw } from "lucide-react";
import { ICON_PROPS } from "@/lib/icon-props";
import { notifyToast } from "@/lib/ui-toast";
import {
  UAT_ALL_TOOLS,
  UAT_NOTE_CATEGORIES,
  UAT_OUT_OF_SCOPE,
  UAT_TOOL_GROUPS,
  UAT_VERDICTS,
  buildUatReport,
  defaultUatState,
  type UatChecklistState,
  type UatNoteCategory,
  type UatVerdict,
} from "@/lib/uat-tools";
import {
  UAT_ALL_ROLE_CASES,
  UAT_ROLE_SECTIONS,
  UAT_ROLE_VERDICTS,
  buildUatRolesReport,
  defaultUatRolesState,
  type UatRoleVerdict,
  type UatRolesState,
} from "@/lib/uat-roles";

type Mode = "tools" | "roles";

function toolsVerdictBadge(v: UatVerdict): string {
  if (v === "يعتمد") return "badge-success";
  if (v === "يحتاج تحسين") return "badge-warning";
  return "badge-neutral";
}

function rolesVerdictBadge(v: UatRoleVerdict): string {
  if (v === "مطابق") return "badge-success";
  if (v === "يحتاج تحسين") return "badge-warning";
  if (v === "خلل") return "badge-danger";
  return "badge-neutral";
}

export default function UatChecklistClient() {
  const [mode, setMode] = useState<Mode>("roles");
  const [state, setState] = useState<UatChecklistState>(defaultUatState);
  const [rolesState, setRolesState] = useState<UatRolesState>(defaultUatRolesState);
  const [filter, setFilter] = useState<"all" | UatVerdict>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UatRoleVerdict>("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const toolsCounts = useMemo(() => {
    const c = { total: 0, "غير مجرّب": 0, يعتمد: 0, "يحتاج تحسين": 0 };
    for (const t of UAT_ALL_TOOLS) {
      const v = state.verdicts[t.id] ?? "غير مجرّب";
      c[v] += 1;
      c.total += 1;
    }
    return c;
  }, [state.verdicts]);

  const rolesCounts = useMemo(() => {
    const c = {
      total: 0,
      "غير مجرّب": 0,
      مطابق: 0,
      "يحتاج تحسين": 0,
      خلل: 0,
    };
    for (const t of UAT_ALL_ROLE_CASES) {
      const v = rolesState.verdicts[t.id] ?? "غير مجرّب";
      c[v] += 1;
      c.total += 1;
    }
    return c;
  }, [rolesState.verdicts]);

  const report = useMemo(
    () => (mode === "tools" ? buildUatReport(state) : buildUatRolesReport(rolesState)),
    [mode, state, rolesState],
  );

  function setVerdict(id: string, value: UatVerdict) {
    setState((prev) => ({
      ...prev,
      verdicts: { ...prev.verdicts, [id]: value },
    }));
  }

  function setNoteCategory(id: string, category: UatNoteCategory) {
    setState((prev) => ({
      ...prev,
      notes: {
        ...prev.notes,
        [id]: { category, text: prev.notes[id]?.text ?? "" },
      },
    }));
  }

  function setNoteText(id: string, text: string) {
    setState((prev) => ({
      ...prev,
      notes: {
        ...prev.notes,
        [id]: { category: prev.notes[id]?.category ?? "", text },
      },
    }));
  }

  function setRoleVerdict(id: string, value: UatRoleVerdict) {
    setRolesState((prev) => ({
      ...prev,
      verdicts: { ...prev.verdicts, [id]: value },
    }));
  }

  function setRoleNote(id: string, text: string) {
    setRolesState((prev) => ({
      ...prev,
      notes: { ...prev.notes, [id]: text },
    }));
  }

  function resetAll() {
    if (!window.confirm("إعادة تعيين تقييمات النموذج الحالي؟")) return;
    if (mode === "tools") setState(defaultUatState());
    else setRolesState(defaultUatRolesState());
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      notifyToast.success("تم نسخ التقرير", { duration: "short" });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShowPreview(true);
      notifyToast.error("تعذّر النسخ — استخدم معاينة التقرير للنسخ اليدوي");
    }
  }

  const q = search.trim().toLowerCase();

  return (
    <>
      <div className="topbar">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="zad-breadcrumb">
              <li>
                <a href="/dashboard">الرئيسية</a>
              </li>
              <li>
                <span className="zad-breadcrumb__sep" aria-hidden="true">
                  ‹
                </span>
                <span aria-current="page">بيئة التجربة</span>
              </li>
            </ol>
          </nav>
          <h1>
            <ClipboardCheck
              {...ICON_PROPS}
              style={{ marginInlineEnd: ".4rem", verticalAlign: "middle" }}
            />
            {mode === "roles" ? "تقييم الأدوار والصلاحيات" : "قائمة تقييم الأدوات"}
          </h1>
          <div className="text-muted">
            بيئة تجربة فقط (`ENABLE_UAT`) — الحالة في الذاكرة أثناء الجلسة · بلا حفظ في الخادم
          </div>
        </div>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <button type="button" className="btn-primary btn-sm" onClick={() => void copyReport()}>
            {copied ? <Check {...ICON_PROPS} /> : <Copy {...ICON_PROPS} />}
            {copied ? "تم النسخ" : "نسخ التقرير"}
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? "إخفاء المعاينة" : "معاينة التقرير"}
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={resetAll}>
            <RotateCcw {...ICON_PROPS} />
            إعادة تعيين
          </button>
        </div>
      </div>

      <div className="tab-bar tab-bar--square" style={{ marginBottom: "1rem" }} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "tools"}
          data-active={mode === "tools" ? "true" : "false"}
          className={mode === "tools" ? "active" : ""}
          onClick={() => setMode("tools")}
        >
          الأدوات
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "roles"}
          data-active={mode === "roles" ? "true" : "false"}
          className={mode === "roles" ? "active" : ""}
          onClick={() => setMode("roles")}
        >
          الأدوار والصلاحيات
        </button>
      </div>

      {mode === "roles" ? (
        <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
          جرّب بكل دور على حدة، وسجّل الرؤية/الوصول/النطاق. التقييم: مطابق · يحتاج تحسين · خلل · غير
          مجرّب. أنشئ حسابًا لكل دور من <code>/admin/users</code> قبل البدء.
        </div>
      ) : null}

      {showPreview && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: ".5rem" }}>معاينة التقرير</h3>
          <textarea
            className="input-field"
            readOnly
            rows={16}
            value={report}
            dir="rtl"
            style={{ fontFamily: "ui-monospace, monospace", fontSize: ".85rem", width: "100%" }}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      )}

      {mode === "tools" ? (
        <>
          <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
            <div className="card stat-card">
              <div className="stat-num">{toolsCounts.total}</div>
              <div className="stat-lbl">إجمالي الأدوات</div>
            </div>
            <div className="card stat-card stat-card--success">
              <div className="stat-num">{toolsCounts["يعتمد"]}</div>
              <div className="stat-lbl">يعتمد</div>
            </div>
            <div className="card stat-card stat-card--warning">
              <div className="stat-num">{toolsCounts["يحتاج تحسين"]}</div>
              <div className="stat-lbl">يحتاج تحسين</div>
            </div>
            <div className="card stat-card">
              <div className="stat-num">{toolsCounts["غير مجرّب"]}</div>
              <div className="stat-lbl">غير مجرّب</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "center" }}>
              <select
                className="input-field"
                style={{ minWidth: 160 }}
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | UatVerdict)}
              >
                <option value="all">كل التقييمات</option>
                {UAT_VERDICTS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                className="input-field"
                style={{ minWidth: 0, flex: 1, width: "100%" }}
                placeholder="بحث بالأداة أو المسار…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {UAT_TOOL_GROUPS.map((group) => {
            const tools = group.tools.filter((t) => {
              const v = state.verdicts[t.id] ?? "غير مجرّب";
              if (filter !== "all" && v !== filter) return false;
              if (!q) return true;
              return (
                t.tool.toLowerCase().includes(q) ||
                t.path.toLowerCase().includes(q) ||
                t.checks.some((c) => c.toLowerCase().includes(q))
              );
            });
            if (tools.length === 0) return null;

            return (
              <div key={group.id} className="card" style={{ marginBottom: "1rem" }}>
                <h3 style={{ marginBottom: ".75rem" }}>{group.title}</h3>
                <div style={{ overflowX: "auto" }}>
                  <table className="tmkeen-table">
                    <thead>
                      <tr>
                        <th>الأداة</th>
                        <th>المسار</th>
                        <th>ما يُتحقق منه</th>
                        <th>الصلاحية</th>
                        <th>التقييم</th>
                        <th>تصنيف الملاحظة</th>
                        <th>ملاحظة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tools.map((tool) => {
                        const v = state.verdicts[tool.id] ?? "غير مجرّب";
                        const note = state.notes[tool.id] ?? {
                          category: "" as UatNoteCategory,
                          text: "",
                        };
                        return (
                          <tr key={tool.id}>
                            <td>
                              <strong>{tool.tool}</strong>
                              <div>
                                <span className={`badge ${toolsVerdictBadge(v)}`}>{v}</span>
                              </div>
                            </td>
                            <td>
                              {tool.href ? (
                                <Link
                                  href={tool.href}
                                  style={{
                                    display: "inline-flex",
                                    gap: ".25rem",
                                    alignItems: "center",
                                    color: "var(--tmkeen-primary)",
                                    textDecoration: "none",
                                  }}
                                >
                                  {tool.path}
                                  <ExternalLink {...ICON_PROPS} />
                                </Link>
                              ) : (
                                <code>{tool.path}</code>
                              )}
                            </td>
                            <td>
                              <ul style={{ margin: 0, paddingInlineStart: "1.1rem" }}>
                                {tool.checks.map((c) => (
                                  <li key={c}>{c}</li>
                                ))}
                              </ul>
                            </td>
                            <td className="text-muted" style={{ fontSize: ".85rem" }}>
                              {tool.permission}
                            </td>
                            <td>
                              <select
                                className="input-field"
                                value={v}
                                onChange={(e) => setVerdict(tool.id, e.target.value as UatVerdict)}
                              >
                                {UAT_VERDICTS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                className="input-field"
                                value={note.category}
                                onChange={(e) =>
                                  setNoteCategory(tool.id, e.target.value as UatNoteCategory)
                                }
                              >
                                {UAT_NOTE_CATEGORIES.map((opt) => (
                                  <option key={opt || "none"} value={opt}>
                                    {opt || "—"}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                className="input-field"
                                placeholder="ملاحظات التجربة…"
                                value={note.text}
                                onChange={(e) => setNoteText(tool.id, e.target.value)}
                                style={{ minWidth: 160 }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <div className="card">
            <h3 style={{ marginBottom: ".75rem" }}>خارج نطاق التجربة</h3>
            <div className="table-wrap">
            <table className="tmkeen-table">
              <thead>
                <tr>
                  <th>البند</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {UAT_OUT_OF_SCOPE.map((row) => (
                  <tr key={row.item}>
                    <td>{row.item}</td>
                    <td className="text-muted">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
            <div className="card stat-card">
              <div className="stat-num">{rolesCounts.total}</div>
              <div className="stat-lbl">حالات الأدوار</div>
            </div>
            <div className="card stat-card stat-card--success">
              <div className="stat-num">{rolesCounts["مطابق"]}</div>
              <div className="stat-lbl">مطابق</div>
            </div>
            <div className="card stat-card stat-card--warning">
              <div className="stat-num">{rolesCounts["يحتاج تحسين"]}</div>
              <div className="stat-lbl">يحتاج تحسين</div>
            </div>
            <div className="card stat-card stat-card--danger">
              <div className="stat-num">{rolesCounts["خلل"]}</div>
              <div className="stat-lbl">خلل</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "center" }}>
              <select
                className="input-field"
                style={{ minWidth: 160 }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "all" | UatRoleVerdict)}
              >
                <option value="all">كل التقييمات</option>
                {UAT_ROLE_VERDICTS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                className="input-field"
                style={{ minWidth: 0, flex: 1, width: "100%" }}
                placeholder="بحث بالقسم أو الحالة…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {UAT_ROLE_SECTIONS.map((section) => {
            const cases = section.cases.filter((c) => {
              const v = rolesState.verdicts[c.id] ?? "غير مجرّب";
              if (roleFilter !== "all" && v !== roleFilter) return false;
              if (!q) return true;
              const hay =
                `${section.title} ${section.roleLabel} ${c.title} ${c.expected}`.toLowerCase();
              return hay.includes(q);
            });
            if (cases.length === 0) return null;

            return (
              <div key={section.id} className="card" style={{ marginBottom: "1rem" }}>
                <div className="card-section" style={{ marginBottom: ".75rem" }}>
                  <h3 style={{ marginBottom: ".25rem" }}>{section.title}</h3>
                  <div className="text-muted" style={{ fontSize: ".85rem" }}>
                    الدور: <strong>{section.roleLabel}</strong>
                    {section.demoHint ? ` · ${section.demoHint}` : ""}
                  </div>
                  <p
                    className="text-muted"
                    style={{ marginTop: ".35rem", marginBottom: 0, fontSize: ".82rem" }}
                  >
                    {section.goldenRule}
                  </p>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="tmkeen-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>ما يُتحقق منه</th>
                        <th>المتوقّع</th>
                        <th>التقييم</th>
                        <th>ملاحظة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map((c) => {
                        const v = rolesState.verdicts[c.id] ?? "غير مجرّب";
                        return (
                          <tr key={c.id}>
                            <td>{c.n}</td>
                            <td>
                              <strong>{c.title}</strong>
                              <div>
                                <span className={`badge ${rolesVerdictBadge(v)}`}>{v}</span>
                              </div>
                              <div
                                className="text-muted"
                                style={{ fontSize: ".75rem", marginTop: ".25rem" }}
                              >
                                {c.dimensions.join(" · ")}
                              </div>
                            </td>
                            <td style={{ fontSize: ".85rem", maxWidth: 320 }}>{c.expected}</td>
                            <td>
                              <select
                                className="input-field"
                                value={v}
                                onChange={(e) =>
                                  setRoleVerdict(c.id, e.target.value as UatRoleVerdict)
                                }
                              >
                                {UAT_ROLE_VERDICTS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                className="input-field"
                                placeholder="ملاحظة…"
                                value={rolesState.notes[c.id] ?? ""}
                                onChange={(e) => setRoleNote(c.id, e.target.value)}
                                style={{ minWidth: 160 }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
