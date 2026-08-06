"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardCheck, Copy, ExternalLink, RotateCcw } from "lucide-react";
import { ICON_PROPS } from "@/lib/icon-props";
import {
  UAT_ALL_TOOLS,
  UAT_NOTE_CATEGORIES,
  UAT_OUT_OF_SCOPE,
  UAT_STORAGE_KEY,
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
  UAT_ROLES_STORAGE_KEY,
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
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(UAT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UatChecklistState;
        const base = defaultUatState();
        setState({
          verdicts: { ...base.verdicts, ...parsed.verdicts },
          notes: { ...base.notes, ...parsed.notes },
        });
      }
      const rawRoles = localStorage.getItem(UAT_ROLES_STORAGE_KEY);
      if (rawRoles) {
        const parsed = JSON.parse(rawRoles) as UatRolesState;
        const base = defaultUatRolesState();
        setRolesState({
          verdicts: { ...base.verdicts, ...parsed.verdicts },
          notes: { ...base.notes, ...parsed.notes },
        });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(UAT_STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(UAT_ROLES_STORAGE_KEY, JSON.stringify(rolesState));
  }, [rolesState, hydrated]);

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
    [mode, state, rolesState]
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
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShowPreview(true);
      window.alert("تعذّر النسخ تلقائياً — حدّد النص من معاينة التقرير وانسخه يدوياً.");
    }
  }

  const q = search.trim().toLowerCase();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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
                <span className="zad-breadcrumb-sep" aria-hidden="true">‹</span>
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
            {mode === "roles"
              ? "مكمّل لنموذج الأدوات — اختبر الرؤية + الوصول + النطاق لكل دور · سلسلة الاعتماد end-to-end"
              : "بيئة التجربة — حسب الشاشات/الأدوات · يعتمد · يحتاج تحسين · غير مجرّب"}
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

      <div className="tab-bar" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className={mode === "roles" ? "active" : ""}
          onClick={() => setMode("roles")}
        >
          حسب الأدوار
        </button>
        <button
          type="button"
          className={mode === "tools" ? "active" : ""}
          onClick={() => setMode("tools")}
        >
          حسب الأدوات
        </button>
      </div>

      {mode === "roles" ? (
        <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
          <strong>القاعدة الذهبية:</strong> لكل دور تحقّق من ثلاثة أبعاد معًا —{" "}
          <strong>رؤية</strong> (الشريط) + <strong>وصول</strong> (منع المسارات) +{" "}
          <strong>نطاق</strong> (بياناته فقط). القسم 6 (سلسلة الاعتماد) يربط الطبقات الثلاث بنقطة
          الانعكاس عند الاعتماد النهائي. التقييم: مطابق · يحتاج تحسين · خلل.
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
                style={{ minWidth: 220, flex: 1 }}
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
                              <textarea
                                className="input-field"
                                rows={2}
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
                style={{ minWidth: 220, flex: 1 }}
                placeholder="بحث بالقسم أو الحالة…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <p className="text-muted" style={{ marginTop: ".75rem", marginBottom: 0 }}>
              الاستخدام: جهّز حسابًا لكل دور من /admin/users → سجّل الدخول → املأ عمود التقييم. كل
              «خلل» يُنسَخ في التقرير ويُحوَّل لأمر إصلاح.
            </p>
          </div>

          {UAT_ROLE_SECTIONS.map((section) => {
            const cases = section.cases.filter((c) => {
              const v = rolesState.verdicts[c.id] ?? "غير مجرّب";
              if (roleFilter !== "all" && v !== roleFilter) return false;
              if (!q) return true;
              const hay = `${section.title} ${c.title} ${c.expected} ${c.steps.join(" ")}`.toLowerCase();
              return hay.includes(q);
            });
            if (cases.length === 0) return null;

            const open = openSections[section.id] ?? true;
            return (
              <div key={section.id} className="zad-accordion" style={{ marginBottom: "1rem" }}>
                <button
                  type="button"
                  className="zad-accordion-trigger"
                  aria-expanded={open}
                  onClick={() =>
                    setOpenSections((s) => ({ ...s, [section.id]: !open }))
                  }
                >
                  <span>{section.title}</span>
                  <span aria-hidden="true">{open ? "▾" : "◂"}</span>
                </button>
                {open ? (
                <div className="zad-accordion-panel">
                <div className="text-muted" style={{ marginBottom: ".35rem", fontSize: ".85rem" }}>
                  الدور: <code>{section.roleLabel}</code> · {section.demoHint}
                </div>
                <div
                  className="alert alert-info"
                  style={{ marginBottom: ".75rem", padding: ".5rem .75rem" }}
                >
                  {section.goldenRule}
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="tmkeen-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>الحالة</th>
                        <th>الأبعاد</th>
                        <th>الخطوات</th>
                        <th>المتوقع</th>
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
                            </td>
                            <td style={{ fontSize: ".8rem" }}>{c.dimensions.join(" · ")}</td>
                            <td>
                              <ol style={{ margin: 0, paddingInlineStart: "1.1rem", fontSize: ".85rem" }}>
                                {c.steps.map((s) => (
                                  <li key={s}>{s}</li>
                                ))}
                              </ol>
                            </td>
                            <td style={{ fontSize: ".85rem", maxWidth: 280 }}>{c.expected}</td>
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
                              <textarea
                                className="input-field"
                                rows={2}
                                placeholder="سجّل الخلل هنا…"
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
                ) : null}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
