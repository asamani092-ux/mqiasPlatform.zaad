"use client";

import { useCallback, useEffect, useState } from "react";
import FilterBar, { FilterField } from "@/components/ui/FilterBar";
import { FREQUENCY_LABEL } from "@/lib/kpi-schemas";
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

      <FilterBar
        actions={
          <button type="button" className="btn-secondary" onClick={() => void load()}>
            تحديث
          </button>
        }
      >
        <FilterField label="المجال">
          <select
            className="input-field"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          >
            <option value="all">كل المجالات</option>
            <option value="STRATEGIC">استراتيجي</option>
            <option value="GOVERNANCE">حوكمة</option>
          </select>
        </FilterField>
        <FilterField label="بحث">
          <input
            className="input-field"
            placeholder="الرمز أو الاسم"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FilterField>
      </FilterBar>

      {canManage && (
        <form className="card" onSubmit={save} style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>{editId ? "تعديل بند" : "إضافة مؤشر / متطلب"}</h3>
          <div className="grid grid-4" style={{ gap: ".75rem", marginBottom: ".75rem" }}>
            <div>
              <label className="label-field" htmlFor="cat-code">الرمز</label>
              <input
                id="cat-code"
                className="input-field"
                required
                disabled={!!editId}
                dir="ltr"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="cat-name">الاسم</label>
              <input
                id="cat-name"
                className="input-field"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="cat-domain">المجال</label>
              <select
                id="cat-domain"
                className="input-field"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              >
                <option value="STRATEGIC">{DOMAIN_LABEL.STRATEGIC}</option>
                <option value="GOVERNANCE">{DOMAIN_LABEL.GOVERNANCE}</option>
              </select>
            </div>
            <div>
              <label className="label-field" htmlFor="cat-unit">وحدة القياس</label>
              <input
                id="cat-unit"
                className="input-field"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="cat-freq">الدورية</label>
              <select
                id="cat-freq"
                className="input-field"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              >
                {Object.entries(FREQUENCY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label className="label-field" htmlFor="cat-data">البيانات المطلوبة</label>
            <textarea
              id="cat-data"
              className="input-field"
              rows={2}
              value={form.requiredData}
              onChange={(e) => setForm({ ...form, requiredData: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <button type="submit" className="btn-primary">{editId ? "حفظ" : "إضافة"}</button>
            {editId ? (
              <button type="button" className="btn-secondary" onClick={() => { setEditId(null); setForm(emptyForm); }}>
                إلغاء
              </button>
            ) : null}
          </div>
        </form>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p className="text-muted">جاري التحميل…</p>
        ) : kpis.length === 0 ? (
          <p className="text-muted">لا بنود في الكتالوج</p>
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
                {canManage ? <th>إجراءات</th> : null}
              </tr>
            </thead>
            <tbody>
              {kpis.map((k) => (
                <tr key={k.id}>
                  <td data-label="الرمز">{k.code}</td>
                  <td data-label="الاسم">{k.name}</td>
                  <td data-label="المجال">
                    <span className="badge-neutral">{DOMAIN_LABEL[k.domain] || k.domain}</span>
                  </td>
                  <td data-label="الإدارة">{k.department?.name ?? "—"}</td>
                  <td data-label="المالك">{k.owner?.name ?? "—"}</td>
                  <td data-label="متطلب القياس">{k.requirement ? "مربوط" : "غير مربوط"}</td>
                  {canManage ? (
                    <td data-label="إجراءات">
                      <button type="button" className="btn-secondary btn-sm" onClick={() => startEdit(k)}>
                        تعديل
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
