"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FilterBar, { FilterField } from "@/components/ui/FilterBar";
import { FILLER_ROLE_LABEL, ROLE_LABEL } from "@/lib/types";
import { notifyToast } from "@/lib/ui-toast";

type ReqRow = {
  id: number;
  code: string;
  name: string;
  fillerRole: string;
  ownerId: number | null;
  departmentId: number | null;
  sectionId: number | null;
  owner: { id: number; name: string; role: string } | null;
  department: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
};

type UserRow = {
  id: number;
  name: string;
  role: string;
  departmentId: number | null;
  sectionId: number | null;
};

export default function AssignRequirementsClient() {
  const [requirements, setRequirements] = useState<ReqRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: number; name: string; departmentId: number }[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [fillerRole, setFillerRole] = useState("");
  const [search, setSearch] = useState("");
  const [unassigned, setUnassigned] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [assignRole, setAssignRole] = useState("EMPLOYEE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (departmentId) params.set("departmentId", departmentId);
    if (sectionId) params.set("sectionId", sectionId);
    if (fillerRole) params.set("fillerRole", fillerRole);
    if (search.trim()) params.set("q", search.trim());
    if (unassigned) params.set("unassigned", "1");
    const res = await fetch(`/api/admin/assign?${params}`);
    if (res.ok) {
      const data = await res.json();
      setRequirements(data.requirements);
      setUsers(data.users);
      setDepartments(data.departments);
      setSections(data.sections);
      setSelected([]);
    } else {
      notifyToast.error("تعذّر تحميل المتطلبات");
    }
    setLoading(false);
  }, [departmentId, sectionId, fillerRole, unassigned, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSections = useMemo(
    () => sections.filter((s) => !departmentId || String(s.departmentId) === departmentId),
    [sections, departmentId]
  );

  const selectedReqs = useMemo(
    () => requirements.filter((r) => selected.includes(r.id)),
    [requirements, selected]
  );

  const owners = useMemo(() => {
    return users.filter((u) => {
      if (u.role !== assignRole) return false;
      if (selectedReqs.length === 0) return true;
      // توافق مع إدارة/قسم المحدد
      return selectedReqs.every((r) => {
        if (assignRole === "SECTION_HEAD" && r.sectionId != null) {
          return u.sectionId === r.sectionId;
        }
        if (r.departmentId != null) return u.departmentId === r.departmentId;
        return true;
      });
    });
  }, [users, assignRole, selectedReqs]);

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    if (selected.length === requirements.length) setSelected([]);
    else setSelected(requirements.map((r) => r.id));
  }

  async function assign() {
    if (selected.length === 0) {
      notifyToast.error("حدّد متطلباً واحداً على الأقل");
      return;
    }
    if (!ownerId) {
      notifyToast.error("اختر المسؤول");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "assign",
        requirementIds: selected,
        ownerId: parseInt(ownerId, 10),
        fillerRole: assignRole,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      notifyToast.success(`تم إسناد ${data.updated} متطلباً وإشعار المسؤول`);
      await load();
    } else {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل الإسناد");
    }
  }

  async function unassign() {
    if (selected.length === 0) {
      notifyToast.error("حدّد متطلباً واحداً على الأقل");
      return;
    }
    if (!window.confirm("إلغاء إسناد المتطلبات المحددة؟")) return;
    setSaving(true);
    const res = await fetch("/api/admin/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "unassign",
        requirementIds: selected,
        ownerId: null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      notifyToast.success(`أُلغي إسناد ${data.updated} متطلباً`, { duration: "short" });
      await load();
    } else {
      const err = await res.json().catch(() => ({}));
      notifyToast.error(err.error || "فشل إلغاء الإسناد");
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>إسناد المتطلبات</h1>
          <div className="text-muted">تعيين جماعي لمن يملأ متطلب القياس ودور التعبئة</div>
        </div>
      </div>

      <FilterBar
        actions={
          <>
            <button type="button" className="btn-primary btn-sm" disabled={saving} onClick={() => void assign()}>
              {saving ? "..." : `إسناد (${selected.length})`}
            </button>
            <button type="button" className="btn-secondary btn-sm" disabled={saving} onClick={() => void unassign()}>
              إلغاء الإسناد
            </button>
          </>
        }
      >
        <FilterField label="بحث">
          <input
            className="input-field"
            placeholder="رمز أو اسم"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FilterField>
        <FilterField label="الإدارة">
          <select
            className="input-field"
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setSectionId("");
            }}
          >
            <option value="">الكل</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="القسم">
          <select className="input-field" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">الكل</option>
            {filteredSections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="دور التعبئة الحالي">
          <select className="input-field" value={fillerRole} onChange={(e) => setFillerRole(e.target.value)}>
            <option value="">الكل</option>
            {Object.entries(FILLER_ROLE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </FilterField>
        <label style={{ display: "flex", alignItems: "end", gap: ".4rem", paddingBottom: ".35rem" }}>
          <input type="checkbox" checked={unassigned} onChange={(e) => setUnassigned(e.target.checked)} />
          غير المسند فقط
        </label>
      </FilterBar>

      <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "end" }}>
        <FilterField label="دور التعبئة عند الإسناد">
          <select
            className="input-field"
            value={assignRole}
            onChange={(e) => {
              setAssignRole(e.target.value);
              setOwnerId("");
            }}
          >
            {Object.entries(FILLER_ROLE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </FilterField>
        <div style={{ minWidth: "14rem" }}>
          <label className="label-field">المسؤول (ضمن نطاق المحدد)</label>
          <select className="input-field" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">— اختر —</option>
            {owners.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({ROLE_LABEL[u.role] || u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">جاري التحميل...</p>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="tmkeen-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={requirements.length > 0 && selected.length === requirements.length}
                    onChange={toggleAll}
                  />
                </th>
                <th>الرمز</th>
                <th>المتطلب</th>
                <th>الإدارة</th>
                <th>القسم</th>
                <th>دور التعبئة</th>
                <th>المسؤول</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.department?.name || "—"}</td>
                  <td>{r.section?.name || "—"}</td>
                  <td>{FILLER_ROLE_LABEL[r.fillerRole] || r.fillerRole}</td>
                  <td>{r.owner?.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {requirements.length === 0 && (
            <p className="text-muted" style={{ padding: "1rem" }}>لا نتائج</p>
          )}
        </div>
      )}
    </>
  );
}
