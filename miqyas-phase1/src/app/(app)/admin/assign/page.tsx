import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import AssignRequirementsClient from "@/components/AssignRequirementsClient";

export default async function AssignRequirementsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.uid) redirect("/login");

  const sessionUser = {
    id: user.uid,
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role,
    departmentId: user.departmentId,
    sectionId: user.sectionId,
  };
  if (!can.assignRequirements(sessionUser)) redirect("/dashboard");

  return <AssignRequirementsClient />;
}
