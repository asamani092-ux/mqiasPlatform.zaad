"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PERIOD_LABEL,
  STATUS_LABEL,
  STATUS_BADGE,
  type KpiStatus,
} from "@/lib/types";

type PendingEntry = {
  id: number;
  year: number;
  period: string;
  actualValue: number;
  achievementPct: number | null;
  deviationPct: number | null;
  status: KpiStatus;
  whatHappened: string | null;
  howHappened: string | null;
  kpi: { code: string; name: string; unit: string; requiredData: string | null };
  employee: { id: number; name: string; email: string };
  evidences: { id: number; fileName: string }[];
};

export default function ApprovalsClient() {
  const [entries, setEntries] = useState<PendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState("");
  const [acting, setActing] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/approvals");
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
    } else if (res.status === 403) {
      setMsg("ليس لديك صلاحية اعتماد القياسات");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(entryId: number, action: "approve" | "reject") {
    if (action === "reject" && !rejectReason.trim()) {
      setMsg("يرجى إدخال سبب الرفض");
      return;
    }
    setActing(entryId);
    setMsg("");
    const res = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryId,
        action,
        rejectReason: action === "reject" ? rejectReason : undefined,
      }),
    });
    setActing(null);
    if (res.ok) {
      setRejectId(null);
      setRejectReason("");
      setMsg(action === "approve" ? "تم الاعتماد" : "تم الرفض");
      await load();
    } else {
      const err = await res.json();
      setMsg(err.error || "فشلت العملية");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>اعتماد القياسات</h1>
          <div className="sub">مراجعة الإدخالات المعلقة واعتمادها أو رفضها</div>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.includes("تم") ? "alert-success" : "alert-error"}`} style={{ marginBottom: "1rem" }}>
          {msg}
        </div>
      )}

      {loading ? (
        <p className="sub">جاري التحميل...</p>
      ) : entries.length === 0 ? (
        <div className="card"><p className="sub">لا توجد قياسات بانتظار الاعتماد.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {entries.map((e) => (
            <div key={e.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: ".5rem", marginBottom: ".75rem" }}>
                <div>
                  <strong>{e.kpi.code}</strong> — {e.kpi.name}
                  <div className="sub">
                    {e.employee.name} · {PERIOD_LABEL[e.period as keyof typeof PERIOD_LABEL] || e.period} {e.year}
                  </div>
                </div>
                <span className={`badge ${STATUS_BADGE[e.status]}`}>{STATUS_LABEL[e.status]}</span>
              </div>

              <div className="grid grid-4" style={{ marginBottom: ".75rem", fontSize: ".82rem" }}>
                <div><span className="sub">المتحقق:</span> <strong>{e.actualValue}</strong></div>
                <div><span className="sub">نسبة الإنجاز:</span> <strong>{e.achievementPct ?? "—"}%</strong></div>
                <div><span className="sub">الانحراف:</span> <strong>{e.deviationPct ?? "—"}%</strong></div>
                <div><span className="sub">البيانات المطلوبة:</span> {e.kpi.requiredData || "—"}</div>
              </div>

              {(e.whatHappened || e.howHappened) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: ".75rem" }}>
                  {e.whatHappened && (
                    <div>
                      <div className="lbl">ماذا حصل؟</div>
                      <p style={{ fontSize: ".82rem" }}>{e.whatHappened}</p>
                    </div>
                  )}
                  {e.howHappened && (
                    <div>
                      <div className="lbl">كيف حصل؟</div>
                      <p style={{ fontSize: ".82rem" }}>{e.howHappened}</p>
                    </div>
                  )}
                </div>
              )}

              {e.evidences.length > 0 && (
                <div style={{ marginBottom: ".75rem" }}>
                  <div className="lbl">الشواهد</div>
                  {e.evidences.map((ev) => (
                    <a
                      key={ev.id}
                      href={`/api/evidence/${ev.id}`}
                      className="badge ontrack"
                      style={{ marginLeft: ".4rem" }}
                    >
                      {ev.fileName}
                    </a>
                  ))}
                </div>
              )}

              {rejectId === e.id ? (
                <div style={{ marginBottom: ".75rem" }}>
                  <label className="lbl">سبب الرفض</label>
                  <textarea
                    className="inp"
                    rows={2}
                    value={rejectReason}
                    onChange={(ev) => setRejectReason(ev.target.value)}
                  />
                  <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem" }}>
                    <button type="button" className="btn-sm btn" disabled={acting === e.id} onClick={() => act(e.id, "reject")}>
                      تأكيد الرفض
                    </button>
                    <button type="button" className="btn-sm btn-ghost" onClick={() => { setRejectId(null); setRejectReason(""); }}>
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <button type="button" className="btn-sm btn" disabled={acting === e.id} onClick={() => act(e.id, "approve")}>
                    {acting === e.id ? "..." : "اعتماد"}
                  </button>
                  <button type="button" className="btn-sm btn-ghost" onClick={() => setRejectId(e.id)}>
                    رفض
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
