"use client";

import { useCallback, useEffect, useState } from "react";

type Setting = { key: string; label: string; value: string };

export default function SettingsClient() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [msg, setMsg] = useState("");

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
        {settings.map((s) => (
          <div key={s.key} style={{ marginBottom: "1.25rem" }}>
            <label className="label-field">{s.label}</label>
            {s.key === "section_head_can_approve" ? (
              <select
                className="input-field"
                style={{ maxWidth: 200 }}
                value={s.value}
                onChange={(e) => save(s.key, e.target.value)}
              >
                <option value="0">معطّل</option>
                <option value="1">مفعّل</option>
              </select>
            ) : (
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
            )}
          </div>
        ))}
      </div>
    </>
  );
}
