import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireManageKpis } from "@/lib/admin-auth";
import { targetSchema } from "@/lib/kpi-schemas";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    requireManageKpis(user);

    const kpiId = parseInt(params.id, 10);
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? "2026", 10);

    const targets = await db.kpiTarget.findMany({
      where: { kpiId, year },
      orderBy: { period: "asc" },
    });

    return NextResponse.json({ targets });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    requireManageKpis(user);

    const kpiId = parseInt(params.id, 10);
    const body = targetSchema.parse(await req.json());

    const target = await db.kpiTarget.upsert({
      where: { kpiId_year_period: { kpiId, year: body.year, period: body.period } },
      create: { kpiId, ...body },
      update: { targetValue: body.targetValue },
    });

    await audit(parseInt(user.id, 10), "SET_TARGET", "KpiTarget", target.id, {
      kpiId,
      year: body.year,
      period: body.period,
    });

    return NextResponse.json({ target });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return POST(req, { params });
}
