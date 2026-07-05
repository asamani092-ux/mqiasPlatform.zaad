import { getSessionUser } from "@/lib/auth";
import { currentQuarter } from "@/lib/kpi";
import MyKpisClient from "@/components/MyKpisClient";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const { year, period } = currentQuarter();

  return (
    <MyKpisClient
      initialYear={year}
      initialPeriod={period}
      userId={parseInt(user.id, 10)}
    />
  );
}
