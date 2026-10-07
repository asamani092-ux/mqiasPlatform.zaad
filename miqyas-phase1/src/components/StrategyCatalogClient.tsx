"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import FilterBar, { FilterField } from "@/components/ui/FilterBar";
import { notifyToast } from "@/lib/ui-toast";

type KpiRow = {
  id: number;
  code: string;
  name: string;
  type: string;
  domain: string;
  feedsStrategic?: boolean;
  isGovernanceRequirement?: boolean;
  unit: string;
  frequency: string;
  department: { id: number; name: string } | null;
  owner: { id: number; name: string } | null;
  requirement: { id: number; code: string; domain: string; ownerId: number | null } | null;
  active: boolean;
};

export default function StrategyCatalogClient({ canManage }: { canManage: boolean }) {
  const [kpis, setKpis] = useState<KpiRow[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === "strategic") params.set("feedsStrategic", "true");
    if (filter === "governance") params.set("isGovernanceRequirement", "true");
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/strategy/catalog?${params}`);
    setLoading(false);
    if (!res.ok) {
      notifyToast.error("تعذّر تحميل الكتالوج");
      return;
    }
    const data = await res.json();
    setKpis(data.kpis);
  }, [filter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>كتالوج الاستراتيجية والحوكمة</h1>
          <div className="text-muted">
            عرض فقط — الإضافة والتعديل من إدارة المؤشرات (مصدر الكتابة الموحّد)
          </div>
        </div>
        {canManage ? (
          <Link href="/admin/kpis" className="btn-primary btn-sm">
            إدارة المؤشرات
          </Link>
        ) : null}
      </div>

      <FilterBar
        actions={
          <button type="button" className="btn-secondary" onClick={() => void load()}>
            تحديث
          </button>
        }
      >
        <FilterField label="الوسم">
          <select
            className="input-field"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">الكل</option>
            <option value="strategic">يغذي الاستراتيجية</option>
            <option value="governance">متطلب حوكمة</option>
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
                <th>الأوسمة</th>
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
                  <td data-label="الأوسمة">
                    <span style={{ display: "inline-flex", gap: ".35rem", flexWrap: "wrap" }}>
                      {k.feedsStrategic ? (
                        <span className="badge-neutral">استراتيجي</span>
                      ) : null}
                      {k.isGovernanceRequirement ? (
                        <span className="badge-neutral">حوكمة</span>
                      ) : null}
                      {!k.feedsStrategic && !k.isGovernanceRequirement ? (
                        <span className="badge-neutral">—</span>
                      ) : null}
                    </span>
                  </td>
                  <td data-label="الإدارة">{k.department?.name ?? "—"}</td>
                  <td data-label="المالك">{k.owner?.name ?? "—"}</td>
                  <td data-label="متطلب القياس">{k.requirement ? "مربوط" : "غير مربوط"}</td>
                  {canManage ? (
                    <td data-label="إجراءات">
                      <Link
                        href={`/admin/kpis?edit=${k.id}`}
                        className="btn-secondary btn-sm"
                      >
                        تعديل
                      </Link>
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
