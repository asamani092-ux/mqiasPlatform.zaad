import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { previousPeriod, scopedKnowledgeWhere } from "@/lib/knowledge-scope";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import type { SessionUser } from "@/lib/rbac";
import type { Period } from "@prisma/client";

export const dynamic = "force-dynamic";

async function knowledgeStats(user: SessionUser, year: number, period: Period) {
  const scope = scopedKnowledgeWhere(user);
  const assets = await db.knowledgeAsset.findMany({
    where: { year, period, ...scope },
  });
  const total = assets.length;
  const approved = assets.filter((a) => a.status === "APPROVED").length;
  const used = assets.filter((a) => a.isUsed).length;
  const draftCount = total - approved;
  const approvedPct = total > 0 ? Math.round((approved / total) * 1000) / 10 : 0;
  const usedPct = total > 0 ? Math.round((used / total) * 1000) / 10 : 0;

  const prev = previousPeriod(year, period);
  const prevCount = await db.knowledgeAsset.count({
    where: { year: prev.year, period: prev.period, ...scope },
  });
  const growthPct =
    prevCount > 0
      ? Math.round(((total - prevCount) / prevCount) * 1000) / 10
      : total > 0
        ? 100
        : 0;

  return { total, approvedPct, usedPct, growthPct, approvedCount: approved, draftCount };
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? "2026", 10);
    const period = (req.nextUrl.searchParams.get("period") ?? "Q1") as
      | "Q1"
      | "Q2"
      | "Q3"
      | "Q4"
      | "H1"
      | "H2"
      | "Y";

    const scope = scopedKnowledgeWhere(user);
    const [stats, assets] = await Promise.all([
      knowledgeStats(user, year, period),
      db.knowledgeAsset.findMany({
        where: { year, period, ...scope },
        include: { department: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ stats, assets });
  } catch (e) {
    return handleApiError(e);
  }
}

const createSchema = z.object({
  title: z.string().min(2).max(500),
  assetType: z.string().max(200).optional().nullable(),
  departmentId: z.number().int().optional().nullable(),
  year: z.number().int(),
  period: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
  status: z.enum(["DRAFT", "APPROVED"]).optional(),
  isUsed: z.boolean().optional(),
});

const updateSchema = createSchema.partial().extend({ id: z.number().int().positive() });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageKnowledge(user)) return jsonError("غير مصرح", 403);

    const body = createSchema.parse(await req.json());
    const asset = await db.knowledgeAsset.create({
      data: {
        title: body.title,
        assetType: body.assetType,
        departmentId: body.departmentId ?? user.departmentId,
        year: body.year,
        period: body.period,
        status: body.status ?? "DRAFT",
        isUsed: body.isUsed ?? false,
      },
      include: { department: { select: { name: true } } },
    });

    await audit(parseInt(user.id, 10), "CREATE_KNOWLEDGE_ASSET", "KnowledgeAsset", asset.id);
    return NextResponse.json({ asset }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageKnowledge(user)) return jsonError("غير مصرح", 403);

    const body = updateSchema.parse(await req.json());
    const scope = scopedKnowledgeWhere(user);
    const existing = await db.knowledgeAsset.findFirst({ where: { id: body.id, ...scope } });
    if (!existing) return jsonError("الأصل غير موجود", 404);

    const asset = await db.knowledgeAsset.update({
      where: { id: body.id },
      data: {
        title: body.title,
        assetType: body.assetType,
        departmentId: body.departmentId,
        status: body.status,
        isUsed: body.isUsed,
      },
      include: { department: { select: { name: true } } },
    });

    await audit(parseInt(user.id, 10), "UPDATE_KNOWLEDGE_ASSET", "KnowledgeAsset", asset.id, body);
    return NextResponse.json({ asset });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
