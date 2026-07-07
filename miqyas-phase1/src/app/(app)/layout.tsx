import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import NotifBell from "@/components/NotifBell";
import Providers from "@/components/Providers";
import { can } from "@/lib/rbac";
import { getSetting } from "@/lib/settings";

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
  const delegationOn = (await getSetting("section_head_can_approve")) === "1";
  const showApprovals = can.approveEntries(sessionUser, delegationOn);
  const isAdmin = can.manageKpis(sessionUser);
  const showExecutive = can.viewExecutive(sessionUser);

  return (
    <Providers>
      <div className="app-shell">
        <Sidebar user={{ name: user.name, role: user.role }} showApprovals={showApprovals} isAdmin={isAdmin} showExecutive={showExecutive} />
        <main className="app-main">
          <div className="app-topbar">
            <NotifBell />
          </div>
          {children}
        </main>
      </div>
    </Providers>
  );
}
