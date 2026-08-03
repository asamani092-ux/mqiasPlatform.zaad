"use client";

import { useCallback, useEffect, useState, type FocusEvent } from "react";
import { currentQuarter } from "@/lib/kpi";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import { notifyToast } from "@/lib/ui-toast";

type Setting = { key: string; label: string; value: string };

const QUARTER_PERIODS: Period[] = ["Q1", "Q2", "Q3", "Q4"];
const MEASUREMENT_ROUND_PERIODS: Period[] = ["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"];

export default function SettingsClient() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [testTo, setTestTo] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
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
      notifyToast.success("تم حفظ الإعداد", { duration: "short" });
      load();
    } else {
      notifyToast.error("فشل حفظ الإعداد");
    }
  }

  function getValue(key: string, fallback: string): string {
    const s = settings.find((x) => x.key === key);
    return s?.value || fallback;
  }

  async function sendTestEmail() {
    setTestBusy(true);
    setTestResult(null);
    const res = await fetch("/api/settings/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testTo.trim() ? { to: testTo.trim() } : {}),
    });
    const data = await res.json().catch(() => ({}));
    setTestBusy(false);
    if (res.ok && data.sent) {
      setTestResult({ ok: true, msg: `أُرسلت رسالة تجريبية إلى ${data.to} من ${data.from}` });
      notifyToast.success("أُرسلت رسالة التجربة", { duration: "short" });
    } else {
      setTestResult({
        ok: false,
        msg: `${data.error || "فشل الإرسال"}${data.hint ? ` — ${data.hint}` : ""}`,
      });
      notifyToast.error("لم تُرسل رسالة التجربة");
    }
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

  function onMeasurementRoundYearBlur(e: FocusEvent<HTMLInputElement>) {
    const next = e.target.value.trim();
    const current = getValue("measurement_round_year", String(defaults.year));
    if (!next || next === current) return;
    save("measurement_round_year", next);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>إعدادات النظام</h1>
          <div className="text-muted">ضبط سلوك المنصة — مشرف النظام</div>
        </div>
      </div>

      <div className="card">
        <div className="alert alert-info" style={{ marginBottom: "1.25rem" }}>
          <strong>طبقات الاعتماد:</strong> الإدخال عبر شواهد المؤشرات · الاعتماد المبدئي لمدير الإدارة دائماً ·
          الاعتماد النهائي ورفض الصياغة/الشواهد لمشرف النظام فقط. لا يوجد تفويض للاعتماد النهائي لأدوار أخرى.
        </div>

        <section style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: ".5rem" }}>جولة القياس</h3>
          <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
            عند إغلاق الجولة يُسمح بحفظ المسودات فقط، بينما يتوقف تقديم القياسات للاعتماد.
            {" "}
            <a href="/admin/report" style={{ fontWeight: 700 }}>تقرير العرض التقديمي</a>
          </div>
          <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label className="label-field">سنة جولة القياس</label>
              <input
                type="number"
                className="input-field"
                style={{ width: 160 }}
                defaultValue={getValue("measurement_round_year", String(defaults.year))}
                key={`round-year-${getValue("measurement_round_year", String(defaults.year))}`}
                onBlur={onMeasurementRoundYearBlur}
              />
            </div>
            <div>
              <label className="label-field">فترة جولة القياس</label>
              <select
                className="input-field"
                style={{ width: 180 }}
                value={getValue("measurement_round_period", defaults.period)}
                onChange={(e) => save("measurement_round_period", e.target.value)}
              >
                {MEASUREMENT_ROUND_PERIODS.map((p) => (
                  <option key={p} value={p}>{PERIOD_LABEL[p]}</option>
                ))}
              </select>
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".45rem",
                minHeight: "2.45rem",
                fontWeight: 700,
              }}
            >
              <input
                type="checkbox"
                checked={getValue("measurement_round_open", "1") !== "0"}
                onChange={(e) => save("measurement_round_open", e.target.checked ? "1" : "0")}
              />
              الجولة مفتوحة للتقديم
            </label>
          </div>
        </section>

        <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid var(--border, #e5e7eb)" }} />

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
          .filter(
            (s) =>
              ![
                "current_year",
                "current_period",
                "measurement_round_year",
                "measurement_round_period",
                "measurement_round_open",
                "section_head_can_approve",
                "dept_manager_can_approve",
                "notify_from_email",
              ].includes(s.key)
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

        <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid var(--border, #e5e7eb)" }} />

        <h3 style={{ marginBottom: ".5rem" }}>البريد والتنبيهات</h3>
        <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
          الاعتماد الأساسي للتنبيهات هو إشعارات المنصة الداخلية، ويُرسل البريد بالتوازي عند ضبطه.
          بريد المرسل يُضبط هنا؛ بيانات خادم SMTP تُضبط في <code>.env</code> على الخادم (الربط لاحقاً).
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label className="label-field">بريد المرسل للتنبيهات</label>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <input
              type="email"
              className="input-field"
              style={{ maxWidth: 280 }}
              placeholder="miqyas@zad.org.sa"
              defaultValue={getValue("notify_from_email", "")}
              key={`from-${getValue("notify_from_email", "")}`}
              id="setting-notify_from_email"
            />
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => {
                const el = document.getElementById("setting-notify_from_email") as HTMLInputElement;
                save("notify_from_email", el.value);
              }}
            >
              حفظ
            </button>
          </div>
          <div className="text-muted" style={{ fontSize: ".78rem", marginTop: ".35rem" }}>
            اتركه فارغاً للعودة إلى قيمة <code>SMTP_FROM</code> من الخادم.
          </div>
        </div>

        <div style={{ marginBottom: ".5rem" }}>
          <label className="label-field">إرسال رسالة تجريبية</label>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <input
              type="email"
              className="input-field"
              style={{ maxWidth: 280 }}
              placeholder="بريد المستلم — فارغ = بريدك"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={testBusy}
              onClick={() => void sendTestEmail()}
            >
              {testBusy ? "جارٍ الإرسال..." : "إرسال تجربة"}
            </button>
          </div>
          {testResult && (
            <div
              className={`alert ${testResult.ok ? "alert-success" : "alert-warn"}`}
              style={{ marginTop: ".6rem" }}
            >
              {testResult.msg}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
