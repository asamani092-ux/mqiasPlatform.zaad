"use client";

import { useCallback, useEffect, useState } from "react";
import { DOMAIN_LABEL } from "@/lib/types";
import { notifyToast } from "@/lib/ui-toast";

type KpiRow = {
  id: number;
  code: string;
  name: string;
  type: string;
  domain: string;
  unit: string;
  frequency: string;
  department: { id: number; name: string } | null;
  owner: { id: number; name: string } | null;
  requirement: { id: number; code: string; domain: string; ownerId: number | null } | null;
  active: boolean;
};

const emptyForm = {
  code: "",
  name: "",
  domain: "STRATEGIC",
  unit: "%",
  frequency: "QUARTERLY",
  polarity: "HIGHER_BETTER",
  requiredData: "",
};

export default function StrategyCatalogClient({ canManage }: { canManage: boolean }) {
  const [kpis, setKpis] = useState<KpiRow[]>([]);
  const [domain, setDomain] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (domain !== "all") params.set("domain", domain);
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/strategy/catalog?${params}`);
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("تعذّر تحميل الكتالوج");
      return;
    }
    const data = await res.json();
    setKpis(data.kpis);
  }, [domain, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.domain === "OPERATIONAL" ? "OPERATIONAL" : "STRATEGIC",
      domain: form.domain,
      unit: form.unit,
      frequency: form.frequency,
      polarity: form.polarity,
      requiredData: form.requiredData.trim() || null,
    };
    const res = await fetch("/api/strategy/catalog", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل الحفظ");
      return;
    }
    notifyToast.success(editId ? "تم التحديث" : "تمت الإضافة — سيظهر في الشواهد بعد الإسناد");
    setForm(emptyForm);
    setEditId(null);
    await load();
  }

  function startEdit(k: KpiRow) {
    setEditId(k.id);
    setForm({
      code: k.code,
      name: k.name,
      domain: k.domain,
      unit: k.unit,
      frequency: k.frequency,
      polarity: "HIGHER_BETTER",
      requiredData: "",
    });
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>كتالوج الاستراتيجية والحوكمة</h1>
          <div className="text-muted">
            مؤشرات ومتطلبات تُدار بشاهد قياس موحّد — الحوكمة مرتبطة بنفس دورة الاعتماد دون حذف السجل الحالي
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
        <select className="input" value={domain} onChange={(e) => setDomain(e.target.value)} style={{ maxWidth: "12rem" }}>
          <option value="all">كل المجالات</option>
          <option value="STRATEGIC">استراتيجي</option>
          <option value="GOVERNANCE">حوكمة</option>
        </select>
        <input
          className="input"
          placeholder="بحث بالرمز أو الاسم"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "12rem" }}
        />
        <button type="button" className="btn-secondary" onClick={() => void load()}>تحديث</button>
      </div>

      {canManage && (
        <form className="card" style={{ marginBottom: "1rem" }} onSubmit={save}>
          <h3 style={{ marginTop: 0 }}>{editId ? "تعديل بند" : "إضافة مؤشر / متطلب"}</h3>
          <div style={{ display: "grid", gap: ".75rem", gridTemplateColumns: "repeat(auto-fit,minmax(11rem,1fr))" }}>
            <label>
              الرمز
              <input className="input" required disabled={!!editId} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </label>
            <label>
              الاسم
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              المجال
              <select className="input" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
                <option value="STRATEGIC">استراتيجي</option>
                <option value="GOVERNANCE">حوكمة</option>
              </select>
            </label>
            <label>
              الوحدة
              <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </label>
            <label>
              الدورية
              <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                <option value="QUARTERLY">ربع سنوي</option>
                <option value="SEMI_ANNUAL">نصف سنوي</option>
                <option value="ANNUAL">سنوي</option>
              </select>
            </label>
          </div>
          <label style={{ display: "block", marginTop: ".75rem" }}>
            البيانات المطلوبة
            <textarea className="input" rows={2} value={form.requiredData} onChange={(e) => setForm({ ...form, requiredData: e.target.value })} />
          </label>
          <div style={{ marginTop: ".75rem", display: "flex", gap: ".5rem" }}>
            <button type="submit" className="btn-primary">{editId ? "حفظ" : "إضافة"}</button>
            {editId && (
              <button type="button" className="btn-secondary" onClick={() => { setEditId(null); setForm(emptyForm); }}>إلغاء</button>
            )}
          </div>
        </form>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p className="text-muted">جاري التحميل…</p>
        ) : (
          <table className="tmkeen-table table--stack">
            <thead>
              <tr>
                <th>الرمز</th>
                <th>الاسم</th>
                <th>المجال</th>
                <th>الإدارة</th>
                <th>المالك</th>
                <th>متطلب القياس</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {kpis.map((k) => (
                <tr key={k.id}>
                  <td data-label="الرمز">{k.code}</td>
                  <td data-label="الاسم">{k.name}</td>
                  <td data-label="المجال">{DOMAIN_LABEL[k.domain] || k.domain}</td>
                  <td data-label="الإدارة">{k.department?.name ?? "—"}</td>
                  <td data-label="المالك">{k.owner?.name ?? "—"}</td>
                  <td data-label="متطلب القياس">{k.requirement ? `#${k.requirement.id}` : "غير مربوط"}</td>
                  {canManage && (
                    <td>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => startEdit(k)}>تعديل</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
