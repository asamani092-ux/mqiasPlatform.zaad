import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import UsersClient from "@/components/UsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can.manageUsers(user)) redirect("/dashboard");

  const departments = await db.department.findMany({
    orderBy: { deptNo: "asc" },
    select: {
      id: true,
      name: true,
      sections: {
        orderBy: { sectionNo: "asc" },
        select: { id: true, name: true, code: true, departmentId: true },
      },
    },
  });

  return <UsersClient departments={departments} />;
}
