import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import AdminKpisClient from "@/components/AdminKpisClient";

export const dynamic = "force-dynamic";

export default async function AdminKpisPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.manageKpis(user)) redirect("/dashboard");

  const [departments, users] = await Promise.all([
    db.department.findMany({
      orderBy: { deptNo: "asc" },
      select: { id: true, name: true },
    }),
    db.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, departmentId: true },
    }),
  ]);

  return <AdminKpisClient departments={departments} users={users} />;
}
