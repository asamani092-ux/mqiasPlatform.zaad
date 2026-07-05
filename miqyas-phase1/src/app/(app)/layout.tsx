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

  return (
    <Providers>
      <div className="app">
        <Sidebar user={{ name: user.name, role: user.role }} showApprovals={showApprovals} />
        <main className="main">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: ".5rem" }}>
            <NotifBell />
          </div>
          {children}
        </main>
      </div>
    </Providers>
  );
}
