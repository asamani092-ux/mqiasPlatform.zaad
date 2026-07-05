"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ROLE_LABEL, USER_STATUS_LABEL, ROLE_VALUES } from "@/lib/types";

type Section = { id: number; name: string; code: string; departmentId: number };
type Department = { id: number; name: string; sections: Section[] };

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  departmentId: number | null;
  sectionId: number | null;
  lastLogin: string | null;
  department: { id: number; name: string } | null;
  section: { id: number; name: string; code: string } | null;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: string;
  departmentId: string;
  sectionId: string;
};

type EditFormState = Omit<FormState, "password" | "email"> & { email: string };

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  departmentId: "",
  sectionId: "",
};

const emptyEditForm: EditFormState = {
  name: "",
  email: "",
  role: "EMPLOYEE",
  departmentId: "",
  sectionId: "",
};

const ROLE_BADGE: Record<string, string> = {
  SYSTEM_ADMIN: "badge-primary",
  EXECUTIVE: "badge-warning",
  DEPT_MANAGER: "badge-primary",
  SECTION_HEAD: "badge-neutral",
  EMPLOYEE: "badge-neutral",
};

function roleScopeHint(role: string): string {
  switch (role) {
    case "DEPT_MANAGER":
      return "مدير الإدارة: يجب اختيار إدارة";
    case "SECTION_HEAD":
      return "رئيس القسم: يجب اختيار قسم (تُستمد الإدارة تلقائيًا)";
    case "EMPLOYEE":
      return "الموظف: يجب اختيار قسم (تُستمد الإدارة تلقائيًا)";
    case "EXECUTIVE":
    case "SYSTEM_ADMIN":
      return "لا يتطلب نطاق إدارة أو قسم";
    default:
      return "";
  }
}

function validateScope(role: string, departmentId: string, sectionId: string): string | null {
  if (role === "DEPT_MANAGER" && !departmentId) return "مدير الإدارة يتطلب اختيار إدارة";
  if ((role === "SECTION_HEAD" || role === "EMPLOYEE") && !sectionId) {
    return "رئيس القسم/الموظف يتطلب اختيار قسم";
  }
  return null;
}

function fmtLastLogin(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

export default function UsersClient({ departments }: { departments: Department[] }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [passwordId, setPasswordId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (search.trim()) q.set("search", search.trim());
    if (roleFilter) q.set("role", roleFilter);
    const res = await fetch(`/api/users${q.toString() ? `?${q}` : ""}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const sectionsForDept = useCallback(
    (deptId: string) => {
      if (!deptId) return [];
      const dept = departments.find((d) => String(d.id) === deptId);
      return dept?.sections ?? [];
    },
    [departments],
  );

  const createSections = useMemo(
    () => sectionsForDept(createForm.departmentId),
    [createForm.departmentId, sectionsForDept],
  );
  const editSections = useMemo(
    () => sectionsForDept(editForm.departmentId),
    [editForm.departmentId, sectionsForDept],
  );

  async function parseError(res: Response): Promise<string> {
    const data = await res.json().catch(() => ({}));
    return data.error || "حدث خطأ";
  }

  function openEdit(u: UserRow) {
    setEditId(u.id);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId != null ? String(u.departmentId) : "",
      sectionId: u.sectionId != null ? String(u.sectionId) : "",
    });
    setEditOpen(true);
    setErr("");
  }

  function openPassword(id: number) {
    setPasswordId(id);
    setNewPassword("");
    setPasswordOpen(true);
    setErr("");
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const scopeErr = validateScope(createForm.role, createForm.departmentId, createForm.sectionId);
    if (scopeErr) {
      setErr(scopeErr);
      return;
    }
    if (createForm.password.length < 8) {
      setErr("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        departmentId: createForm.departmentId ? +createForm.departmentId : null,
        sectionId: createForm.sectionId ? +createForm.sectionId : null,
      }),
    });

    if (!res.ok) {
      setErr(await parseError(res));
      return;
    }

    setMsg("تم إنشاء المستخدم بنجاح");
    setCreateOpen(false);
    setCreateForm(emptyForm);
    load();
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null) return;
    setErr("");
    const scopeErr = validateScope(editForm.role, editForm.departmentId, editForm.sectionId);
    if (scopeErr) {
      setErr(scopeErr);
      return;
    }

    const res = await fetch(`/api/users/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        role: editForm.role,
        departmentId: editForm.departmentId ? +editForm.departmentId : null,
        sectionId: editForm.sectionId ? +editForm.sectionId : null,
      }),
    });

    if (!res.ok) {
      setErr(await parseError(res));
      return;
    }

    setMsg("تم تحديث المستخدم");
    setEditOpen(false);
    setEditId(null);
    load();
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordId == null) return;
    setErr("");
    if (newPassword.length < 8) {
      setErr("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    const res = await fetch(`/api/users/${passwordId}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });

    if (!res.ok) {
      setErr(await parseError(res));
      return;
    }

    setMsg("تم إعادة تعيين كلمة المرور");
    setPasswordOpen(false);
    setPasswordId(null);
  }

  async function toggleStatus(u: UserRow) {
    const next = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const label = next === "ACTIVE" ? "تفعيل" : "تعطيل";
    if (!window.confirm(`هل تريد ${label} المستخدم «${u.name}»؟`)) return;

    setErr("");
    const res = await fetch(`/api/users/${u.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      setErr(await parseError(res));
      return;
    }

    setMsg(next === "ACTIVE" ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم");
    load();
  }

  function renderScopeFields<T extends { role: string; departmentId: string; sectionId: string }>(
    form: T,
    setForm: React.Dispatch<React.SetStateAction<T>>,
    sections: Section[],
  ) {
    const needsDept = form.role === "DEPT_MANAGER" || form.role === "SECTION_HEAD" || form.role === "EMPLOYEE";
    const needsSection = form.role === "SECTION_HEAD" || form.role === "EMPLOYEE";

    if (!needsDept && !needsSection) return null;

    return (
      <>
        {needsDept && (
          <div style={{ marginBottom: "1rem" }}>
            <label className="label-field">الإدارة</label>
            <select
              className="input-field"
              value={form.departmentId}
              onChange={(e) =>
                setForm({ ...form, departmentId: e.target.value, sectionId: "" })
              }
            >
              <option value="">— اختر إدارة —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
        {needsSection && (
          <div style={{ marginBottom: "1rem" }}>
            <label className="label-field">القسم</label>
            <select
              className="input-field"
              value={form.sectionId}
              onChange={(e) => {
                const section = sections.find((s) => String(s.id) === e.target.value);
                setForm({
                  ...form,
                  sectionId: e.target.value,
                  departmentId: section ? String(section.departmentId) : form.departmentId,
                });
              }}
            >
              <option value="">— اختر قسم —</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>إدارة المستخدمين</h1>
          <div className="text-muted">إنشاء وتعديل حسابات المنصة — مشرف النظام فقط</div>
        </div>
        <button type="button" className="btn-primary" onClick={() => { setCreateOpen(true); setErr(""); setCreateForm(emptyForm); }}>
          إضافة مستخدم
        </button>
      </div>

      {msg && (
        <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
          <span className="badge-success" style={{ marginInlineEnd: ".5rem" }}>✓</span>
          {msg}
        </div>
      )}
      {err && !createOpen && !editOpen && !passwordOpen && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{err}</div>
      )}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
          <input
            className="input-field"
            style={{ maxWidth: 280 }}
            placeholder="بحث بالاسم أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input-field"
            style={{ maxWidth: 200 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">كل الأدوار</option>
            {ROLE_VALUES.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <table className="tmkeen-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد</th>
              <th>الدور</th>
              <th>الإدارة</th>
              <th>القسم</th>
              <th>الحالة</th>
              <th>آخر دخول</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--tmkeen-brand-gray)" }}>
                  لا يوجد مستخدمون
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td dir="ltr" style={{ textAlign: "start" }}>{u.email}</td>
                  <td>
                    <span className={ROLE_BADGE[u.role] || "badge-neutral"}>
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>
                  <td>{u.department?.name ?? "—"}</td>
                  <td>{u.section?.name ?? "—"}</td>
                  <td>
                    <span className={u.status === "ACTIVE" ? "badge-success" : "badge-danger"}>
                      {USER_STATUS_LABEL[u.status] || u.status}
                    </span>
                  </td>
                  <td>{fmtLastLogin(u.lastLogin)}</td>
                  <td>
                    <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(u)}>
                        تعديل
                      </button>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => openPassword(u.id)}>
                        كلمة المرور
                      </button>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => toggleStatus(u)}>
                        {u.status === "ACTIVE" ? "تعطيل" : "تفعيل"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-panel card wide" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem" }}>إضافة مستخدم</h3>
            {err && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{err}</div>}
            <form onSubmit={submitCreate}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label-field">الاسم</label>
                <input
                  className="input-field"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label-field">البريد الإلكتروني</label>
                <input
                  type="email"
                  className="input-field"
                  dir="ltr"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label-field">كلمة المرور</label>
                <input
                  type="password"
                  className="input-field"
                  dir="ltr"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label-field">الدور</label>
                <select
                  className="input-field"
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      role: e.target.value,
                      departmentId: "",
                      sectionId: "",
                    })
                  }
                >
                  {ROLE_VALUES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
                <p className="text-muted" style={{ marginTop: ".35rem", marginBottom: 0 }}>
                  {roleScopeHint(createForm.role)}
                </p>
              </div>
              {renderScopeFields(createForm, setCreateForm, createSections)}
              <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}>
                <button type="submit" className="btn-primary">إنشاء</button>
                <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editOpen && editId != null && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal-panel card wide" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem" }}>تعديل مستخدم</h3>
            {err && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{err}</div>}
            <form onSubmit={submitEdit}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label-field">الاسم</label>
                <input
                  className="input-field"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label-field">البريد الإلكتروني</label>
                <input className="input-field" dir="ltr" value={editForm.email} disabled />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label-field">الدور</label>
                <select
                  className="input-field"
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      role: e.target.value,
                      departmentId: "",
                      sectionId: "",
                    })
                  }
                >
                  {ROLE_VALUES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
                <p className="text-muted" style={{ marginTop: ".35rem", marginBottom: 0 }}>
                  {roleScopeHint(editForm.role)}
                </p>
              </div>
              {renderScopeFields(editForm, setEditForm, editSections)}
              <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}>
                <button type="submit" className="btn-primary">حفظ</button>
                <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordOpen && passwordId != null && (
        <div className="modal-overlay" onClick={() => setPasswordOpen(false)}>
          <div className="modal-panel card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem" }}>إعادة تعيين كلمة المرور</h3>
            {err && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{err}</div>}
            <form onSubmit={submitPassword}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label-field">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  className="input-field"
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <button type="submit" className="btn-primary">حفظ</button>
                <button type="button" className="btn-secondary" onClick={() => setPasswordOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
