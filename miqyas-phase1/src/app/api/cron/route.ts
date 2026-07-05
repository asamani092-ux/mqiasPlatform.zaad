import { NextRequest, NextResponse } from "next/server";
import { runEarlyWarning, escalateLateActions } from "@/lib/cron-jobs";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return unauthorized();

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) return unauthorized();

  const [earlyWarning, escalation] = await Promise.all([
    runEarlyWarning(),
    escalateLateActions(),
  ]);

  return NextResponse.json({ ok: true, earlyWarning, escalation });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
