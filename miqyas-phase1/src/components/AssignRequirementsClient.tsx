"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FilterBar, { FilterField } from "@/components/ui/FilterBar";
import { FILLER_ROLE_LABEL, ROLE_LABEL } from "@/lib/types";
import { notifyToast } from "@/lib/ui-toast";
import { filterAssignCandidates } from "@/lib/requirement-owner-scope";
import { roleToFillerRole } from "@/lib/approval-status";

type ReqRow = {
  id: number;
  code: string;
  name: string;
  fillerRole: string;
  ownerId: number | null;
  departmentId: number | null;
  sectionId: number | null;
  owner: {
    id: number;
    name: string;
    role: string;
    departmentId: number | null;
    department?: { name: string } | null;
  } | null;
  department: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
};

type UserRow = {
  id: number;
  name: string;
  role: string;
  departmentId: number | null;
  sectionId: number | null;
  department?: { name: string } | null;
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
  const [scopedDepartmentId, setScopedDepartmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const autoAssigned = useRef<Set<number>>(new Set());

  const isManagerScoped = scopedDepartmentId != null;

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
      autoAssigned.current.clear();
      setRequirements(data.requirements);
      setUsers(data.users);
      setDepartments(data.departments);
      setSections(data.sections);
      setScopedDepartmentId(data.scopedDepartmentId ?? null);
      if (data.scopedDepartmentId != null) {
        setDepartmentId((prev) =>
          prev === String(data.scopedDepartmentId) ? prev : String(data.scopedDepartmentId)
        );
      }
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

  function candidatesFor(r: ReqRow): UserRow[] {
    return filterAssignCandidates(users, r);
  }

  async function assignOne(requirementId: number, ownerId: number | null, silent = false) {
    setSavingId(requirementId);
    const body =
      ownerId == null
        ? { requirementIds: [requirementId], ownerId: null, action: "unassign" as const }
        : (() => {
            const owner = users.find((u) => u.id === ownerId);
            const filler = owner ? roleToFillerRole(owner.role as never) : null;
            return {
              requirementIds: [requirementId],
              ownerId,
              fillerRole: filler ?? undefined,
              action: "assign" as const,
            };
          })();

    const res = await fetch("/api/admin/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSavingId(null);
    if (res.ok) {
      if (!silent) {
        notifyToast.success(ownerId == null ? "أُلغي الإسناد" : "تم الإسناد", {
          duration: "short",
        });
      }
      setRequirements((prev) =>
        prev.map((r) => {
          if (r.id !== requirementId) return r;
          if (ownerId == null) {
            return { ...r, ownerId: null, owner: null };
          }
          const u = users.find((x) => x.id === ownerId);
          return {
            ...r,
            ownerId,
            fillerRole: u ? roleToFillerRole(u.role as never) || r.fillerRole : r.fillerRole,
            owner: u
              ? {
                  id: u.id,
                  name: u.name,
                  role: u.role,
                  departmentId: u.departmentId,
                  department: u.department ?? null,
                }
              : r.owner,
          };
        })
      );
    } else {
      const err = await res.json().catch(() => ({}));
      if (!silent) notifyToast.error(err.error || "فشل الإسناد");
      await load();
    }
  }

  // إسناد تلقائي عند مرشح واحد فقط — Time O(n)
  useEffect(() => {
    if (loading) return;
    for (const r of requirements) {
      if (r.ownerId != null) continue;
      if (autoAssigned.current.has(r.id)) continue;
      const cands = candidatesFor(r);
      if (cands.length !== 1) continue;
      autoAssigned.current.add(r.id);
      void assignOne(r.id, cands[0].id, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- مرّة لكل تحميل قائمة
  }, [loading, requirements, users]);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>إسناد المسؤولين</h1>
          <div className="text-muted">
            قائمة منسدلة داخل كل مؤشر — الاسم مع الدور · مرشح واحد يُسند تلقائياً
            {isManagerScoped ? " · نطاق إدارتك فقط" : ""}
          </div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
        كل متطلب له مسؤول واحد يظهر في شواهد المؤشرات. غيّر المسؤول من القائمة في الصف مباشرة.
      </div>

      <FilterBar>
        {!isManagerScoped ? (
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
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}
        <FilterField label="القسم">
          <select
            className="input-field"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
          >
            <option value="">الكل</option>
            {filteredSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="دور التعبئة الحالي">
          <select
            className="input-field"
            value={fillerRole}
            onChange={(e) => setFillerRole(e.target.value)}
          >
            <option value="">الكل</option>
            <option value="EMPLOYEE">{FILLER_ROLE_LABEL.EMPLOYEE}</option>
            <option value="SECTION_HEAD">{FILLER_ROLE_LABEL.SECTION_HEAD}</option>
            <option value="DEPT_MANAGER">{FILLER_ROLE_LABEL.DEPT_MANAGER}</option>
          </select>
        </FilterField>
        <FilterField label="بحث">
          <input
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="رمز أو اسم"
          />
        </FilterField>
        <FilterField label="بلا مسؤول فقط">
          <input
            type="checkbox"
            checked={unassigned}
            onChange={(e) => setUnassigned(e.target.checked)}
          />
        </FilterField>
      </FilterBar>

      {loading ? (
        <p className="text-muted">جاري التحميل...</p>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="tmkeen-table table--stack">
            <thead>
              <tr>
                <th>الرمز</th>
                <th>المتطلب</th>
                <th>الإدارة</th>
                <th>القسم</th>
                <th>المسؤول</th>
              </tr>
            </thead>
            <tbody>
              {requirements.length === 0 ? (
                <tr>
                  <td colSpan={5} data-label="" className="text-muted">
                    لا متطلبات مطابقة للفلتر
                  </td>
                </tr>
              ) : (
                requirements.map((r) => {
                  const cands = candidatesFor(r);
                  const mismatched =
                    r.owner &&
                    r.departmentId != null &&
                    r.owner.departmentId != null &&
                    r.owner.departmentId !== r.departmentId;
                  return (
                    <tr key={r.id}>
                      <td data-label="الرمز">{r.code}</td>
                      <td data-label="المتطلب">{r.name}</td>
                      <td data-label="الإدارة">{r.department?.name || "—"}</td>
                      <td data-label="القسم">{r.section?.name || "—"}</td>
                      <td data-label="المسؤول">
                        <select
                          className="input-field"
                          style={{ width: "100%", minWidth: 0 }}
                          disabled={savingId === r.id}
                          value={r.ownerId ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            void assignOne(r.id, v ? parseInt(v, 10) : null);
                          }}
                        >
                          <option value="">بلا مسؤول</option>
                          {cands.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} — {ROLE_LABEL[u.role] || u.role}
                            </option>
                          ))}
                          {r.ownerId && !cands.some((c) => c.id === r.ownerId) && r.owner ? (
                            <option value={r.ownerId}>
                              {r.owner.name} — {ROLE_LABEL[r.owner.role] || r.owner.role} (خارج النطاق)
                            </option>
                          ) : null}
                        </select>
                        {mismatched ? (
                          <div className="text-danger" style={{ fontSize: ".75rem" }}>
                            تعارض إدارة المسؤول
                          </div>
                        ) : null}
                        {cands.length === 0 ? (
                          <div className="text-muted" style={{ fontSize: ".75rem" }}>
                            لا مرشحين في النطاق
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
