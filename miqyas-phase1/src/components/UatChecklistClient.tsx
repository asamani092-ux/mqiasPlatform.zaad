"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, ExternalLink, RotateCcw } from "lucide-react";
import { ICON_PROPS } from "@/lib/icon-props";
import {
  UAT_ALL_TOOLS,
  UAT_NOTE_CATEGORIES,
  UAT_OUT_OF_SCOPE,
  UAT_STORAGE_KEY,
  UAT_TOOL_GROUPS,
  UAT_VERDICTS,
  defaultUatState,
  type UatChecklistState,
  type UatNoteCategory,
  type UatVerdict,
} from "@/lib/uat-tools";

function verdictBadge(v: UatVerdict): string {
  if (v === "يعتمد") return "badge-success";
  if (v === "يحتاج تحسين") return "badge-warning";
  return "badge-neutral";
}

export default function UatChecklistClient() {
  const [state, setState] = useState<UatChecklistState>(defaultUatState);
  const [filter, setFilter] = useState<"all" | UatVerdict>("all");
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);

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
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(UAT_STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const counts = useMemo(() => {
    const c = { total: 0, "غير مجرّب": 0, يعتمد: 0, "يحتاج تحسين": 0 };
    for (const t of UAT_ALL_TOOLS) {
      const v = state.verdicts[t.id] ?? "غير مجرّب";
      c[v] += 1;
      c.total += 1;
    }
    return c;
  }, [state.verdicts]);

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

  function resetAll() {
    if (!window.confirm("إعادة تعيين كل التقييمات والملاحظات؟")) return;
    setState(defaultUatState());
  }

  const q = search.trim().toLowerCase();

  return (
    <>
      <div className="topbar">
        <div>
          <h1>
            <ClipboardCheck {...ICON_PROPS} style={{ marginInlineEnd: ".4rem", verticalAlign: "middle" }} />
            قائمة تقييم الأدوات
          </h1>
          <div className="text-muted">
            تجربة قبول (UAT) — حدّد لكل أداة: يعتمد · يحتاج تحسين · غير مجرّب
          </div>
        </div>
        <button type="button" className="btn-secondary btn-sm" onClick={resetAll}>
          <RotateCcw {...ICON_PROPS} />
          إعادة تعيين
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
        <div className="card stat-card">
          <div className="stat-num">{counts.total}</div>
          <div className="stat-lbl">إجمالي الأدوات</div>
        </div>
        <div className="card stat-card stat-card--success">
          <div className="stat-num">{counts["يعتمد"]}</div>
          <div className="stat-lbl">يعتمد</div>
        </div>
        <div className="card stat-card stat-card--warning">
          <div className="stat-num">{counts["يحتاج تحسين"]}</div>
          <div className="stat-lbl">يحتاج تحسين</div>
        </div>
        <div className="card stat-card">
          <div className="stat-num">{counts["غير مجرّب"]}</div>
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
                    const note = state.notes[tool.id] ?? { category: "" as UatNoteCategory, text: "" };
                    return (
                      <tr key={tool.id}>
                        <td>
                          <strong>{tool.tool}</strong>
                          <div>
                            <span className={`badge ${verdictBadge(v)}`}>{v}</span>
                          </div>
                        </td>
                        <td>
                          {tool.href ? (
                            <Link
                              href={tool.href}
                              style={{ display: "inline-flex", gap: ".25rem", alignItems: "center", color: "var(--tmkeen-primary, #0f766e)" }}
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
                            onChange={(e) => setNoteCategory(tool.id, e.target.value as UatNoteCategory)}
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
        <p className="text-muted" style={{ marginBottom: ".75rem" }}>
          ROADMAP / قرارات مؤجلة — لا تُقيَّم كأدوات جاهزة
        </p>
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
  );
}
