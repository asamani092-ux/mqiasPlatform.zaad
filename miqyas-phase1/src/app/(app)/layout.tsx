import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import NotifBell from "@/components/NotifBell";
import Providers from "@/components/Providers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.uid) redirect("/login");

  return (
    <Providers>
      <div className="app">
        <Sidebar user={{ name: user.name, role: user.role }} />
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
