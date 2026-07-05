"use client";

import { useCallback, useEffect, useState } from "react";
import { PERIOD_LABEL, type Period } from "@/lib/types";
import { FREQUENCY_LABEL, TYPE_LABEL, POLARITY_LABEL_API } from "@/lib/kpi-schemas";
import { resolvePeriods } from "@/lib/kpi";

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

export default function AdminKpisClient() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [targetYear, setTargetYear] = useState(2026);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const q = search ? `?search=${encodeURIComponent(search)}&active=all` : "?active=all";
    const res = await fetch(`/api/kpis${q}`);
    if (res.ok) {
      const data = await res.json();
      setKpis(data.kpis);
    }
  }, [search]);

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
      unit: kpi.unit,
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
    load();
  }

  const periods = resolvePeriods(form.frequency);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>إدارة المؤشرات</h1>
          <div className="sub">تعريف المؤشرات والمستهدفات — مشرف النظام</div>
        </div>
        <input className="inp" style={{ width: 220 }} placeholder="بحث بالرمز أو الاسم..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{msg}</div>}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>{editId ? "تعديل مؤشر" : "مؤشر جديد"}</h3>
        <div className="grid grid-4" style={{ gap: ".75rem", marginBottom: ".75rem" }}>
          {[
            ["code", "رمز المؤشر"],
            ["name", "اسم المؤشر"],
            ["unit", "وحدة القياس"],
            ["requiredData", "البيانات المطلوبة"],
            ["ownerLabel", "الإدارة المالكة (نص)"],
            ["ownerId", "معرف الموظف المسؤول"],
            ["baseline", "خط الأساس"],
            ["annualTarget", "المستهدف السنوي"],
            ["recommendation", "توصيات القسم"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="lbl">{label}</label>
              <input className="inp" value={(form as Record<string, string>)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: ".75rem" }}>
          <select className="inp" style={{ width: "auto" }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "STRATEGIC" })}>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="inp" style={{ width: "auto" }} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as "QUARTERLY" })}>
            {Object.entries(FREQUENCY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="inp" style={{ width: "auto" }} value={form.polarity} onChange={(e) => setForm({ ...form, polarity: e.target.value as "HIGHER_BETTER" })}>
            {Object.entries(POLARITY_LABEL_API).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <h4 style={{ marginBottom: ".5rem" }}>المستهدفات — {targetYear}</h4>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: ".75rem" }}>
          {periods.map((p) => (
            <div key={p}>
              <label className="lbl">{PERIOD_LABEL[p as Period]}</label>
              <input className="inp" style={{ width: 100 }} value={targets[p] ?? ""} onChange={(e) => setTargets({ ...targets, [p]: e.target.value })} />
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-sm" onClick={saveKpi}>{editId ? "تحديث" : "إنشاء"}</button>
        {editId && <button type="button" className="btn-sm btn-ghost" style={{ marginRight: ".5rem" }} onClick={() => { setEditId(null); setForm(emptyForm); }}>إلغاء</button>}
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>الرمز</th><th>الاسم</th><th>النوع</th><th>الدورية</th><th>الإدارة</th><th>نشط</th><th></th>
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
                <td>
                  <button type="button" className="btn-sm btn-ghost" onClick={() => startEdit(k)}>تعديل</button>
                  {k.active && <button type="button" className="btn-sm btn-ghost" style={{ marginRight: ".3rem" }} onClick={() => softDelete(k.id)}>تعطيل</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
