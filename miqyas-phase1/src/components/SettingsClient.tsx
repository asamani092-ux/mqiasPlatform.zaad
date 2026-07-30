"use client";

import { useCallback, useEffect, useState, type FocusEvent } from "react";
import { currentQuarter } from "@/lib/kpi";
import { PERIOD_LABEL, type Period } from "@/lib/types";

type Setting = { key: string; label: string; value: string };

const QUARTER_PERIODS: Period[] = ["Q1", "Q2", "Q3", "Q4"];

export default function SettingsClient() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [msg, setMsg] = useState("");
  const defaults = currentQuarter();

  const load = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(key: string, value: string) {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) {
      setMsg("تم حفظ الإعداد");
      load();
    }
  }

  function getValue(key: string, fallback: string): string {
    const s = settings.find((x) => x.key === key);
    return s?.value || fallback;
  }

  function onYearBlur(e: FocusEvent<HTMLInputElement>) {
    const next = e.target.value.trim();
    const current = getValue("current_year", String(defaults.year));
    if (!next || next === current) return;
    if (
      !window.confirm(
        "لن تُحذف البيانات التاريخية؛ يتغيّر العرض الافتراضي فقط. هل تريد المتابعة؟",
      )
    ) {
      e.target.value = current;
      return;
    }
    save("current_year", next);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>إعدادات النظام</h1>
          <div className="text-muted">ضبط سلوك المنصة — مشرف النظام</div>
        </div>
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{msg}</div>}

      <div className="card">
        <div style={{ marginBottom: "1.25rem" }}>
          <label className="label-field">سنة القياس الحالية</label>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <input
              type="number"
              className="input-field"
              style={{ maxWidth: 200 }}
              defaultValue={getValue("current_year", String(defaults.year))}
              key={`year-${getValue("current_year", String(defaults.year))}`}
              onBlur={onYearBlur}
            />
          </div>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label className="label-field">الفترة الحالية</label>
          <select
            className="input-field"
            style={{ maxWidth: 200 }}
            value={getValue("current_period", defaults.period)}
            onChange={(e) => save("current_period", e.target.value)}
          >
            {QUARTER_PERIODS.map((p) => (
              <option key={p} value={p}>{PERIOD_LABEL[p]}</option>
            ))}
          </select>
        </div>

        {settings
          .filter((s) => s.key === "section_head_can_approve" || s.key === "dept_manager_can_approve")
          .map((s) => (
            <div key={s.key} style={{ marginBottom: "1.25rem" }}>
              <label className="label-field">{s.label}</label>
              <select
                className="input-field"
                style={{ maxWidth: 200 }}
                value={s.value}
                onChange={(e) => save(s.key, e.target.value)}
              >
                <option value="0">معطّل</option>
                <option value="1">مفعّل</option>
              </select>
            </div>
          ))}

        {settings
          .filter(
            (s) =>
              !["current_year", "current_period", "section_head_can_approve", "dept_manager_can_approve"].includes(
                s.key
              )
          )
          .map((s) => (
            <div key={s.key} style={{ marginBottom: "1.25rem" }}>
              <label className="label-field">{s.label}</label>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <input
                  className="input-field"
                  style={{ maxWidth: 200 }}
                  defaultValue={s.value}
                  id={`setting-${s.key}`}
                />
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => {
                    const el = document.getElementById(`setting-${s.key}`) as HTMLInputElement;
                    save(s.key, el.value);
                  }}
                >
                  حفظ
                </button>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
