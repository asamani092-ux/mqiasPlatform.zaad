"use client";

import { useCallback, useEffect, useState, type FocusEvent } from "react";
import { currentQuarter } from "@/lib/kpi";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import { notifyToast } from "@/lib/ui-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Setting = { key: string; label: string; value: string };

type TabId = "round" | "display" | "thresholds" | "mail";

type RoundConfirm = {
  step: 1 | 2;
  nextOpen: boolean;
  remaining: number;
  missingEvidence: number;
  total: number;
};

const QUARTER_PERIODS: Period[] = ["Q1", "Q2", "Q3", "Q4"];
const MEASUREMENT_ROUND_PERIODS: Period[] = ["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"];

const TABS: { id: TabId; label: string }[] = [
  { id: "round", label: "جولة القياس" },
  { id: "display", label: "العرض الافتراضي" },
  { id: "thresholds", label: "العتبات والتنبيهات" },
  { id: "mail", label: "البريد" },
];

export default function SettingsClient() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [tab, setTab] = useState<TabId>("round");
  const [testTo, setTestTo] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [roundBusy, setRoundBusy] = useState(false);
  const [roundConfirm, setRoundConfirm] = useState<RoundConfirm | null>(null);
  const defaults = currentQuarter();

  const load = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(key: string, value: string) {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) {
      notifyToast.success("تم حفظ الإعداد", { duration: "short" });
      await load();
      return true;
    }
    notifyToast.error("فشل حفظ الإعداد");
    return false;
  }

  function getValue(key: string, fallback: string): string {
    const s = settings.find((x) => x.key === key);
    return s?.value || fallback;
  }

  const roundOpen = getValue("measurement_round_open", "1") !== "0";

  async function beginRoundToggle(nextOpen: boolean) {
    setRoundBusy(true);
    try {
      let remaining = 0;
      let missingEvidence = 0;
      let total = 0;
      if (!nextOpen) {
        const res = await fetch("/api/approvals/closure-progress");
        if (res.ok) {
          const data = await res.json();
          remaining = data.totals?.remaining ?? 0;
          missingEvidence = data.totals?.missingEvidence ?? 0;
          total = data.totals?.total ?? 0;
        }
      }
      setRoundConfirm({ step: 1, nextOpen, remaining, missingEvidence, total });
    } finally {
      setRoundBusy(false);
    }
  }

  async function commitRoundToggle() {
    if (!roundConfirm) return;
    setRoundBusy(true);
    const ok = await save("measurement_round_open", roundConfirm.nextOpen ? "1" : "0");
    setRoundBusy(false);
    if (ok) {
      notifyToast.success(roundConfirm.nextOpen ? "فُتحت جولة القياس" : "أُغلقت جولة القياس");
      setRoundConfirm(null);
    }
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
    void save("current_year", next);
  }

  function onMeasurementRoundYearBlur(e: FocusEvent<HTMLInputElement>) {
    const next = e.target.value.trim();
    const current = getValue("measurement_round_year", String(defaults.year));
    if (!next || next === current) return;
    void save("measurement_round_year", next);
  }

  const step1Body = roundConfirm
    ? roundConfirm.nextOpen
      ? "سيُعاد فتح جولة القياس: يُسمح بالتقديم ورفع الشواهد والاعتماد المبدئي. الاعتماد النهائي يبقى متاحًا دائمًا."
      : [
          "سيُغلق المشرف جولة القياس.",
          "بعد الإغلاق: يتوقف التقديم ورفع/حذف الشواهد والاعتماد المبدئي.",
          "يبقى الاعتماد النهائي متاحًا لإكمال المؤشرات.",
          "",
          `مؤشرات الجولة: ${roundConfirm.total}`,
          `لم تُغلق نهائيًا: ${roundConfirm.remaining}`,
          `بلا شاهد نشط: ${roundConfirm.missingEvidence}`,
          roundConfirm.remaining > 0 || roundConfirm.missingEvidence > 0
            ? "\nتنبيه: توجد مؤشرات غير مكتملة — راجع «متابعة الإغلاق» للتذكير قبل/بعد الإغلاق."
            : "\nكل مؤشرات الجولة معتمدة نهائيًا ولديها شواهد.",
        ].join("\n")
    : "";

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
          <strong>طبقات الاعتماد:</strong> الإدخال عبر شواهد المؤشرات · الاعتماد المبدئي لمدير الإدارة ·
          الاعتماد النهائي لمشرف النظام. عند إغلاق الجولة يتوقف الرفع والاعتماد المبدئي ويبقى النهائي.
        </div>

        <div className="tab-bar tab-bar--square" role="tablist" aria-label="أقسام الإعدادات">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              data-active={tab === t.id ? "true" : "false"}
              className={tab === t.id ? "active" : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "round" && (
          <section style={{ marginTop: "1.25rem" }}>
            <h3 style={{ marginBottom: ".5rem" }}>دورة القياس</h3>
            <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
              الفتح والإغلاق للمشرف فقط مع تأكيد ثنائي. عند الإغلاق يُنبَّه بعدد المؤشرات غير المغلقة وبلا شواهد.
              {" "}
              <a href="/approvals" style={{ fontWeight: 700 }}>متابعة الإغلاق والتذكير</a>
              {" · "}
              <a href="/admin/report" style={{ fontWeight: 700 }}>منشئ العرض التقديمي</a>
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
                  onChange={(e) => void save("measurement_round_period", e.target.value)}
                >
                  {MEASUREMENT_ROUND_PERIODS.map((p) => (
                    <option key={p} value={p}>
                      {PERIOD_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">حالة الجولة</label>
                <div style={{ display: "flex", gap: ".5rem", alignItems: "center", minHeight: "2.45rem" }}>
                  <span className={`badge ${roundOpen ? "badge-success" : "badge-danger"}`}>
                    {roundOpen ? "مفتوحة" : "مغلقة"}
                  </span>
                  <button
                    type="button"
                    className={roundOpen ? "btn-danger btn-sm" : "btn-primary btn-sm"}
                    disabled={roundBusy}
                    onClick={() => void beginRoundToggle(!roundOpen)}
                  >
                    {roundOpen ? "إغلاق الجولة" : "فتح الجولة"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "display" && (
          <section style={{ marginTop: "1.25rem" }}>
            <h3 style={{ marginBottom: ".5rem" }}>العرض الافتراضي للوحات</h3>
            <p className="text-muted" style={{ marginBottom: "1rem", fontSize: ".875rem" }}>
              لا يحذف بيانات تاريخية — يغيّر الافتراضي عند عدم تحديد فترة في المسارات.
            </p>
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label-field">سنة القياس الحالية</label>
              <input
                type="number"
                className="input-field"
                style={{ maxWidth: 200 }}
                defaultValue={getValue("current_year", String(defaults.year))}
                key={`year-${getValue("current_year", String(defaults.year))}`}
                onBlur={onYearBlur}
              />
            </div>
            <div>
              <label className="label-field">الفترة الحالية</label>
              <select
                className="input-field"
                style={{ maxWidth: 200 }}
                value={getValue("current_period", defaults.period)}
                onChange={(e) => void save("current_period", e.target.value)}
              >
                {QUARTER_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {PERIOD_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
          </section>
        )}

        {tab === "thresholds" && (
          <section style={{ marginTop: "1.25rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>العتبات والتنبيهات</h3>
            {settings
              .filter((s) =>
                ["early_warning_gap_pct", "action_escalation_days"].includes(s.key),
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
                        void save(s.key, el.value);
                      }}
                    >
                      حفظ
                    </button>
                  </div>
                </div>
              ))}
          </section>
        )}

        {tab === "mail" && (
          <section style={{ marginTop: "1.25rem" }}>
            <h3 style={{ marginBottom: ".5rem" }}>البريد والتنبيهات</h3>
            <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
              الاعتماد الأساسي للتنبيهات هو إشعارات المنصة الداخلية، ويُرسل البريد بالتوازي عند ضبطه.
              بريد المرسل يُضبط هنا؛ بيانات خادم SMTP في <code>.env</code>.
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
                    const el = document.getElementById(
                      "setting-notify_from_email",
                    ) as HTMLInputElement;
                    void save("notify_from_email", el.value);
                  }}
                >
                  حفظ
                </button>
              </div>
              <div className="text-muted" style={{ fontSize: ".78rem", marginTop: ".35rem" }}>
                اتركه فارغاً للعودة إلى قيمة <code>SMTP_FROM</code> من الخادم.
              </div>
            </div>
            <div>
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
          </section>
        )}
      </div>

      <ConfirmDialog
        open={roundConfirm?.step === 1}
        title={roundConfirm?.nextOpen ? "تأكيد فتح الجولة" : "تأكيد إغلاق الجولة"}
        body={step1Body}
        confirmLabel="متابعة للتأكيد الثاني"
        destructive={!roundConfirm?.nextOpen}
        busy={roundBusy}
        onClose={() => setRoundConfirm(null)}
        onConfirm={() => setRoundConfirm((c) => (c ? { ...c, step: 2 } : null))}
      />
      <ConfirmDialog
        open={roundConfirm?.step === 2}
        title="التأكيد الثاني"
        body={
          roundConfirm?.nextOpen
            ? "اكتب «فتح» لتأكيد فتح جولة القياس."
            : "اكتب «إغلاق» لتأكيد إغلاق جولة القياس."
        }
        confirmLabel={roundConfirm?.nextOpen ? "فتح الجولة" : "إغلاق الجولة"}
        confirmPhrase={roundConfirm?.nextOpen ? "فتح" : "إغلاق"}
        phraseHint={
          roundConfirm?.nextOpen ? "اكتب «فتح» حرفيًا" : "اكتب «إغلاق» حرفيًا"
        }
        destructive={!roundConfirm?.nextOpen}
        busy={roundBusy}
        onClose={() => setRoundConfirm(null)}
        onConfirm={() => void commitRoundToggle()}
      />
    </>
  );
}
