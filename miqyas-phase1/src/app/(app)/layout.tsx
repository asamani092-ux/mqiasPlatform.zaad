import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import Providers from "@/components/Providers";
import { can } from "@/lib/rbac";
import { isUatEnabled } from "@/lib/uat-enabled";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
  const showApprovals = can.finalApprove(sessionUser);
  const showUat = isUatEnabled();

  let departmentName: string | null = null;
  let sectionName: string | null = null;
  if (user.departmentId != null || user.sectionId != null) {
    const [dept, section] = await Promise.all([
      user.departmentId != null
        ? db.department.findUnique({
            where: { id: user.departmentId },
            select: { name: true },
          })
        : Promise.resolve(null),
      user.sectionId != null
        ? db.section.findUnique({
            where: { id: user.sectionId },
            select: { name: true },
          })
        : Promise.resolve(null),
    ]);
    departmentName = dept?.name ?? null;
    sectionName = section?.name ?? null;
  }

  return (
    <Providers>
      <AppShell
        user={{
          name: user.name ?? "",
          role: user.role,
          departmentName,
          sectionName,
        }}
        showApprovals={showApprovals}
        showUat={showUat}
      >
        {children}
      </AppShell>
    </Providers>
  );
}
