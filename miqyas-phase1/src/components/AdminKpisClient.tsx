"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import { FREQUENCY_LABEL, TYPE_LABEL, POLARITY_LABEL_API } from "@/lib/kpi-schemas";
import { resolvePeriods } from "@/lib/kpi";
import ImportClient from "@/components/ImportClient";

const KPI_UNITS = ["%", "عدد", "ريال", "مستفيد", "يوم", "ساعة", "أخرى"] as const;

type Department = { id: number; name: string };
type DeptUser = { id: number; name: string; departmentId: number | null };

type Kpi = {
  id: number;
  code: string;
  name: string;
  type: string;
  unit: string;
  polarity: string;
  frequency: string;
  requiredData: string | null;
  departmentId: number | null;
  sectionId: number | null;
  ownerLabel: string | null;
  ownerId: number | null;
  baseline: number | null;
  annualTarget: number | null;
  recommendation: string | null;
  strategicGoalId: number | null;
  operationalGoalId: number | null;
  active: boolean;
  department?: { name: string } | null;
};

const emptyForm = {
  code: "",
  name: "",
  type: "STRATEGIC" as const,
  unit: "%",
  polarity: "HIGHER_BETTER" as const,
  frequency: "QUARTERLY" as const,
  requiredData: "",
  departmentId: "",
  sectionId: "",
  ownerLabel: "",
  ownerId: "",
  baseline: "",
  annualTarget: "",
  recommendation: "",
  strategicGoalId: "",
  operationalGoalId: "",
};

type Tab = "kpis" | "import";
type TypeFilter = "all" | "STRATEGIC" | "OPERATIONAL";

export default function AdminKpisClient({
  departments,
  users,
}: {
  departments: Department[];
  users: DeptUser[];
}) {
  const [tab, setTab] = useState<Tab>("kpis");
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [targetYear, setTargetYear] = useState(2026);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const deptUsers = useMemo(() => {
    if (!form.departmentId) return users;
    const deptId = parseInt(form.departmentId, 10);
    return users.filter((u) => u.departmentId === deptId);
  }, [form.departmentId, users]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ active: "all" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (typeFilter !== "all") params.set("type", typeFilter);
    const res = await fetch(`/api/kpis?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setKpis(data.kpis);
    }
  }, [debouncedSearch, typeFilter]);

  useEffect(() => { load(); }, [load]);

  async function loadTargets(kpiId: number, freq: string) {
    const res = await fetch(`/api/kpis/${kpiId}/targets?year=${targetYear}`);
    if (res.ok) {
      const data = await res.json();
      const t: Record<string, string> = {};
      for (const p of resolvePeriods(freq as "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL")) {
        const found = data.targets.find((x: { period: string }) => x.period === p);
        t[p] = found ? String(found.targetValue) : "";
      }
      setTargets(t);
    }
  }

  function startEdit(kpi: Kpi) {
    setEditId(kpi.id);
    setForm({
      code: kpi.code,
      name: kpi.name,
      type: kpi.type as "STRATEGIC",
      unit: KPI_UNITS.includes(kpi.unit as (typeof KPI_UNITS)[number]) ? kpi.unit : "أخرى",
      polarity: kpi.polarity as "HIGHER_BETTER",
      frequency: kpi.frequency as "QUARTERLY",
      requiredData: kpi.requiredData ?? "",
      departmentId: kpi.departmentId ? String(kpi.departmentId) : "",
      sectionId: kpi.sectionId ? String(kpi.sectionId) : "",
      ownerLabel: kpi.ownerLabel ?? "",
      ownerId: kpi.ownerId ? String(kpi.ownerId) : "",
      baseline: kpi.baseline != null ? String(kpi.baseline) : "",
      annualTarget: kpi.annualTarget != null ? String(kpi.annualTarget) : "",
      recommendation: kpi.recommendation ?? "",
      strategicGoalId: kpi.strategicGoalId ? String(kpi.strategicGoalId) : "",
      operationalGoalId: kpi.operationalGoalId ? String(kpi.operationalGoalId) : "",
    });
    loadTargets(kpi.id, kpi.frequency);
  }

  function bodyFromForm() {
    return {
      code: form.code,
      name: form.name,
      type: form.type,
      unit: form.unit,
      polarity: form.polarity,
      frequency: form.frequency,
      requiredData: form.requiredData || null,
      departmentId: form.departmentId ? parseInt(form.departmentId, 10) : null,
      sectionId: form.sectionId ? parseInt(form.sectionId, 10) : null,
      ownerLabel: form.ownerLabel || null,
      ownerId: form.ownerId ? parseInt(form.ownerId, 10) : null,
      baseline: form.baseline ? parseFloat(form.baseline) : null,
      annualTarget: form.annualTarget ? parseFloat(form.annualTarget) : null,
      recommendation: form.recommendation || null,
      strategicGoalId: form.strategicGoalId ? parseInt(form.strategicGoalId, 10) : null,
      operationalGoalId: form.operationalGoalId ? parseInt(form.operationalGoalId, 10) : null,
    };
  }

  async function saveKpi() {
    const body = bodyFromForm();
    const res = editId
      ? await fetch(`/api/kpis/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/kpis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (!res.ok) {
      const err = await res.json();
      setMsg(err.error || "فشل الحفظ");
      return;
    }

    const data = await res.json();
    const kpiId = editId ?? data.kpi.id;

    for (const [period, val] of Object.entries(targets)) {
      if (val === "") continue;
      await fetch(`/api/kpis/${kpiId}/targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: targetYear, period, targetValue: parseFloat(val) }),
      });
    }

    setMsg("تم حفظ المؤشر");
    setEditId(null);
    setForm(emptyForm);
    setTargets({});
    load();
  }

  async function softDelete(id: number) {
    if (!confirm("تعطيل هذا المؤشر؟")) return;
    await fetch(`/api/kpis/${id}`, { method: "DELETE" });
    setMsg("تم تعطيل المؤشر");
    load();
  }

  async function reactivate(id: number) {
    if (!confirm("إعادة تفعيل هذا المؤشر؟")) return;
    const res = await fetch(`/api/kpis/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: true }),
    });
    if (res.ok) {
      setMsg("تم إعادة تفعيل المؤشر");
      load();
    } else {
      setMsg("فشلت إعادة التفعيل");
    }
  }

  const periods = resolvePeriods(form.frequency);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>إدارة المؤشرات</h1>
          <div className="text-muted">تعريف المؤشرات والمستهدفات — مشرف النظام</div>
        </div>
        {tab === "kpis" && (
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", alignItems: "center" }}>
            <select
              className="input-field"
              style={{ width: "auto" }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            >
              <option value="all">كل الأنواع</option>
              <option value="STRATEGIC">استراتيجي</option>
              <option value="OPERATIONAL">تشغيلي</option>
            </select>
            <input
              className="input-field"
              style={{ width: 220 }}
              placeholder="بحث بالرمز أو الاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="tab-bar" style={{ marginBottom: "1rem" }}>
        <button type="button" className={tab === "kpis" ? "active" : ""} onClick={() => setTab("kpis")}>
          المؤشرات
        </button>
        <button type="button" className={tab === "import" ? "active" : ""} onClick={() => setTab("import")}>
          استيراد Excel
        </button>
      </div>

      {tab === "import" ? (
        <>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginBottom: ".5rem" }}>دليل أعمدة القالب</h3>
            <p className="text-muted" style={{ fontSize: ".82rem", marginBottom: ".5rem" }}>
              رمزالمؤشر · المؤشر · نوع المؤشر · وحدة القياس · الإدارة المالكة · المستهدف · المتحقق الفعلي · حالة الاعتماد · ماذا حصل؟ · كيف حصل؟
            </p>
            <p className="text-muted" style={{ fontSize: ".82rem" }}>
              بذرة التجربة (<code>npm run seed:excel</code>) تأخذ من الملف أسماء المؤشرات والإدارات فقط،
              وتولّد المستهدفات/الفعلي افتراضياً — لا تعتمد النتائج الظاهرة كقياس رسمي.
            </p>
          </div>
          <ImportClient embedded />
        </>
      ) : (
        <>
          {msg && (
            <div
              className={`alert ${msg.includes("فشل") ? "alert-error" : "alert-success"}`}
              style={{ marginBottom: "1rem" }}
            >
              {msg}
            </div>
          )}

          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3>{editId ? "تعديل مؤشر" : "مؤشر جديد"}</h3>
            <div className="grid grid-4" style={{ gap: ".75rem", marginBottom: ".75rem" }}>
              {[
                ["code", "رمز المؤشر"],
                ["name", "اسم المؤشر"],
                ["requiredData", "البيانات المطلوبة"],
                ["baseline", "خط الأساس"],
                ["annualTarget", "المستهدف السنوي"],
                ["recommendation", "توصيات القسم"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="label-field">{label}</label>
                  <input className="input-field" value={(form as Record<string, string>)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="label-field">وحدة القياس</label>
                <select className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {KPI_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">الإدارة</label>
                <select
                  className="input-field"
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value, ownerId: "" })}
                >
                  <option value="">— اختر إدارة —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">الموظف المسؤول</label>
                <select
                  className="input-field"
                  value={form.ownerId}
                  onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                  disabled={!form.departmentId}
                >
                  <option value="">— اختر موظف —</option>
                  {deptUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: ".75rem" }}>
              <select className="input-field" style={{ width: "auto" }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "STRATEGIC" })}>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select className="input-field" style={{ width: "auto" }} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as "QUARTERLY" })}>
                {Object.entries(FREQUENCY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select className="input-field" style={{ width: "auto" }} value={form.polarity} onChange={(e) => setForm({ ...form, polarity: e.target.value as "HIGHER_BETTER" })}>
                {Object.entries(POLARITY_LABEL_API).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <h4 style={{ marginBottom: ".5rem" }}>المستهدفات — {targetYear}</h4>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: ".75rem" }}>
              {periods.map((p) => (
                <div key={p}>
                  <label className="label-field">{PERIOD_LABEL[p as Period]}</label>
                  <input className="input-field" style={{ width: 100 }} value={targets[p] ?? ""} onChange={(e) => setTargets({ ...targets, [p]: e.target.value })} />
                </div>
              ))}
            </div>
            <button type="button" className="btn-primary btn-sm" onClick={saveKpi}>{editId ? "تحديث" : "إنشاء"}</button>
            {editId && <button type="button" className="btn-secondary btn-sm" style={{ marginRight: ".5rem" }} onClick={() => { setEditId(null); setForm(emptyForm); }}>إلغاء</button>}
          </div>

          <div className="card" style={{ overflowX: "auto" }}>
            <table className="tmkeen-table">
              <thead>
                <tr>
                  <th>الرمز</th><th>الاسم</th><th>النوع</th><th>الدورية</th><th>الإدارة</th><th>نشط</th><th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((k) => (
                  <tr key={k.id}>
                    <td>{k.code}</td>
                    <td>{k.name}</td>
                    <td>{TYPE_LABEL[k.type as keyof typeof TYPE_LABEL]}</td>
                    <td>{FREQUENCY_LABEL[k.frequency as keyof typeof FREQUENCY_LABEL]}</td>
                    <td>{k.department?.name || k.ownerLabel || "—"}</td>
                    <td>{k.active ? "نعم" : "لا"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button type="button" className="btn-secondary btn-sm" title="تعديل المؤشر" onClick={() => startEdit(k)}>
                        تعديل
                      </button>
                      {k.active ? (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          style={{ marginRight: ".3rem" }}
                          title="تعطيل المؤشر"
                          onClick={() => softDelete(k.id)}
                        >
                          تعطيل
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          style={{ marginRight: ".3rem" }}
                          title="إعادة تفعيل المؤشر"
                          onClick={() => reactivate(k.id)}
                        >
                          إعادة تفعيل
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
