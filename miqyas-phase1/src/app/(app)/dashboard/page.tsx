import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { currentQuarter } from "@/lib/kpi";
import { STATUS_LABEL, STATUS_BADGE, PERIOD_LABEL, type KpiStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const { year, period } = currentQuarter();

  const [kpiCount, entries, openCards, alerts] = await Promise.all([
    db.kpi.count({ where: { active: true } }),
    db.kpiEntry.findMany({
      where: { year, period, approvalStatus: "APPROVED" },
      include: { kpi: { select: { name: true, code: true } } },
    }),
    db.deviationCard.count({ where: { status: { not: "CLOSED" } } }),
    db.earlyWarningAlert.count({ where: { year, period } }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const e of entries) byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  const avg = entries.length
    ? Math.round(entries.reduce((s: number, e: any) => s + (e.achievementPct || 0), 0) / entries.length)
    : 0;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>اللوحة الرئيسية</h1>
          <div className="sub">أهلًا {user.name} · {PERIOD_LABEL[period]} {year}</div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1rem" }}>
        <div className="card stat"><div className="num">{kpiCount}</div><div className="lbl">إجمالي المؤشرات النشطة</div></div>
        <div className="card stat" style={{ borderRightColor: "var(--green)" }}><div className="num">{avg}%</div><div className="lbl">متوسط التحقق للفترة</div></div>
        <div className="card stat" style={{ borderRightColor: "var(--amber)" }}><div className="num">{alerts}</div><div className="lbl">تنبيهات الإنذار المبكر</div></div>
        <div className="card stat" style={{ borderRightColor: "var(--red)" }}><div className="num">{openCards}</div><div className="lbl">بطاقات انحراف غير مغلقة</div></div>
      </div>

      <div className="card">
        <h3>توزيع حالات المؤشرات المعتمدة — {PERIOD_LABEL[period]} {year}</h3>
        {entries.length === 0 ? (
          <p className="sub">لا توجد قياسات معتمدة لهذه الفترة بعد.</p>
        ) : (
          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
            {(Object.keys(byStatus) as KpiStatus[]).map((s) => (
              <span key={s} className={"badge " + STATUS_BADGE[s]}>
                {STATUS_LABEL[s]} · {byStatus[s]}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
