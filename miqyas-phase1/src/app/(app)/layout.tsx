import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import Providers from "@/components/Providers";
import { can } from "@/lib/rbac";
import { getApprovalDelegationFlags } from "@/lib/approval-settings";
import { isUatEnabled } from "@/lib/uat-enabled";

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
  const flags = await getApprovalDelegationFlags();
  const showApprovals = can.approveEntries(sessionUser, flags);
  const showUat = isUatEnabled();

  return (
    <Providers>
      <AppShell
        user={{ name: user.name, role: user.role }}
        showApprovals={showApprovals}
        showUat={showUat}
      >
        {children}
      </AppShell>
    </Providers>
  );
}
