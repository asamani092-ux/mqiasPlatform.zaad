"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FILLER_ROLE_LABEL, ROLE_LABEL } from "@/lib/types";

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
      toast.error("تعذّر تحميل المتطلبات");
    }
    setLoading(false);
  }, [departmentId, sectionId, fillerRole, unassigned]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSections = useMemo(
    () =>
      sections.filter((s) => !departmentId || String(s.departmentId) === departmentId),
    [sections, departmentId]
  );

  const owners = useMemo(
    () => users.filter((u) => u.role === assignRole),
    [users, assignRole]
  );

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    if (selected.length === requirements.length) setSelected([]);
    else setSelected(requirements.map((r) => r.id));
  }

  async function assign() {
    if (selected.length === 0) {
      toast.error("حدّد متطلباً واحداً على الأقل");
      return;
    }
    if (!ownerId) {
      toast.error("اختر المسؤول");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementIds: selected,
        ownerId: parseInt(ownerId, 10),
        fillerRole: assignRole,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      toast.success(`تم إسناد ${data.updated} متطلباً`);
      await load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "فشل الإسناد");
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

      <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
        <div>
          <label className="label-field">الإدارة</label>
          <select className="input-field" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setSectionId(""); }}>
            <option value="">الكل</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">القسم</label>
          <select className="input-field" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">الكل</option>
            {filteredSections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">دور التعبئة الحالي</label>
          <select className="input-field" value={fillerRole} onChange={(e) => setFillerRole(e.target.value)}>
            <option value="">الكل</option>
            {Object.entries(FILLER_ROLE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "end", gap: ".4rem", paddingBottom: ".35rem" }}>
          <input type="checkbox" checked={unassigned} onChange={(e) => setUnassigned(e.target.checked)} />
          غير المسند فقط
        </label>
      </div>

      <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "end" }}>
        <div>
          <label className="label-field">دور التعبئة عند الإسناد</label>
          <select className="input-field" value={assignRole} onChange={(e) => { setAssignRole(e.target.value); setOwnerId(""); }}>
            {Object.entries(FILLER_ROLE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: "14rem" }}>
          <label className="label-field">المسؤول</label>
          <select className="input-field" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">— اختر —</option>
            {owners.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({ROLE_LABEL[u.role] || u.role})
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn-primary" disabled={saving} onClick={() => void assign()}>
          {saving ? "..." : `إسناد المحدد (${selected.length})`}
        </button>
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
                <th>دور التعبئة</th>
                <th>المسؤول</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => toggle(r.id)}
                    />
                  </td>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.department?.name || "—"}</td>
                  <td>{FILLER_ROLE_LABEL[r.fillerRole] || r.fillerRole}</td>
                  <td>{r.owner?.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {requirements.length === 0 && <p className="text-muted" style={{ padding: "1rem" }}>لا نتائج</p>}
        </div>
      )}
    </>
  );
}
