import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import AdminKpisClient from "@/components/AdminKpisClient";

export const dynamic = "force-dynamic";

export default async function AdminKpisPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.writeKpis(user)) redirect("/dashboard");

  const scopedDept =
    user.role === "DEPT_MANAGER" && !can.manageKpis(user) ? user.departmentId : null;

  const [departments, users] = await Promise.all([
    db.department.findMany({
      where: scopedDept != null ? { id: scopedDept } : undefined,
      orderBy: { deptNo: "asc" },
      select: { id: true, name: true },
    }),
    db.user.findMany({
      where: {
        status: "ACTIVE",
        ...(scopedDept != null ? { departmentId: scopedDept } : {}),
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, departmentId: true },
    }),
  ]);

  const editRaw = searchParams.edit;
  const editId =
    typeof editRaw === "string" && /^\d+$/.test(editRaw) ? parseInt(editRaw, 10) : null;

  return (
    <AdminKpisClient
      departments={departments}
      users={users}
      canImport={can.manageKpis(user)}
      scopedDepartmentId={scopedDept}
      initialEditId={editId}
    />
  );
}
