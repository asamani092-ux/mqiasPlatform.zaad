import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { governanceStats } from "@/lib/governance-scope";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.viewGovernance(user)) return jsonError("غير مصرح", 403);
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? "2026", 10);
    const period = (req.nextUrl.searchParams.get("period") ?? "Q1") as
      | "Q1"
      | "Q2"
      | "Q3"
      | "Q4"
      | "H1"
      | "H2"
      | "Y";

    const [stats, requirements, observations] = await Promise.all([
      governanceStats(year, period),
      db.governanceRequirement.findMany({ where: { year }, orderBy: { id: "asc" }, take: 1000 }),
      db.governanceObservation.findMany({ orderBy: { createdAt: "desc" }, take: 1000 }),
    ]);

    return NextResponse.json({ stats, requirements, observations });
  } catch (e) {
    return handleApiError(e);
  }
}

const createSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("requirement"),
    code: z.string().min(1).max(50),
    title: z.string().min(2).max(500),
    category: z.string().max(200).optional().nullable(),
    year: z.number().int(),
    owner: z.string().max(200).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    status: z.enum(["COMPLIANT", "PARTIAL", "NON_COMPLIANT", "PENDING"]).optional(),
    compliancePct: z.number().min(0).max(100).optional(),
  }),
  z.object({
    type: z.literal("observation"),
    title: z.string().min(2).max(500),
    openedYear: z.number().int(),
    openedPeriod: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
  }),
]);

const updateSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("requirement"),
    id: z.number().int().positive(),
    code: z.string().min(1).max(50).optional(),
    status: z.enum(["COMPLIANT", "PARTIAL", "NON_COMPLIANT", "PENDING"]).optional(),
    compliancePct: z.number().min(0).max(100).optional(),
    owner: z.string().max(200).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    title: z.string().min(2).max(500).optional(),
    category: z.string().max(200).optional().nullable(),
  }),
  z.object({
    type: z.literal("observation"),
    id: z.number().int().positive(),
    status: z.enum(["OPEN", "CLOSED"]).optional(),
    title: z.string().min(2).max(500).optional(),
    closedYear: z.number().int().optional().nullable(),
    closedPeriod: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]).optional().nullable(),
  }),
]);

const deleteSchema = z.object({
  type: z.enum(["requirement", "observation"]),
  id: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageGovernance(user)) return jsonError("غير مصرح", 403);

    const body = createSchema.parse(await req.json());

    if (body.type === "requirement") {
      const req_ = await db.governanceRequirement.create({
        data: {
          code: body.code,
          title: body.title,
          category: body.category,
          year: body.year,
          owner: body.owner,
          notes: body.notes,
          status: body.status ?? "PENDING",
          compliancePct: body.compliancePct ?? 0,
        },
      });
      await audit(parseInt(user.id, 10), "CREATE_GOV_REQUIREMENT", "GovernanceRequirement", req_.id);
      return NextResponse.json({ item: req_ }, { status: 201 });
    }

    const obs = await db.governanceObservation.create({
      data: {
        title: body.title,
        openedYear: body.openedYear,
        openedPeriod: body.openedPeriod,
      },
    });
    await audit(parseInt(user.id, 10), "CREATE_GOV_OBSERVATION", "GovernanceObservation", obs.id);
    return NextResponse.json({ item: obs }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageGovernance(user)) return jsonError("غير مصرح", 403);

    const body = updateSchema.parse(await req.json());

    if (body.type === "requirement") {
      const item = await db.governanceRequirement.update({
        where: { id: body.id },
        data: {
          code: body.code,
          status: body.status,
          compliancePct: body.compliancePct,
          owner: body.owner,
          notes: body.notes,
          title: body.title,
          category: body.category,
        },
      });
      await audit(parseInt(user.id, 10), "UPDATE_GOV_REQUIREMENT", "GovernanceRequirement", item.id, body);
      return NextResponse.json({ item });
    }

    let closedAt: Date | null | undefined;
    if (body.status === "CLOSED") {
      closedAt = new Date();
    } else if (body.status === "OPEN") {
      closedAt = null;
    }

    const item = await db.governanceObservation.update({
      where: { id: body.id },
      data: {
        status: body.status,
        title: body.title,
        closedYear: body.closedYear,
        closedPeriod: body.closedPeriod,
        closedAt,
      },
    });
    await audit(parseInt(user.id, 10), "UPDATE_GOV_OBSERVATION", "GovernanceObservation", item.id, body);
    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageGovernance(user)) return jsonError("غير مصرح", 403);

    const idParam = req.nextUrl.searchParams.get("id");
    const typeParam = req.nextUrl.searchParams.get("type") ?? "requirement";
    const body = deleteSchema.parse({
      type: typeParam,
      id: parseInt(idParam ?? "", 10),
    });

    if (body.type === "requirement") {
      await db.governanceRequirement.delete({ where: { id: body.id } });
      await audit(parseInt(user.id, 10), "DELETE_GOV_REQUIREMENT", "GovernanceRequirement", body.id);
      return NextResponse.json({ ok: true });
    }

    await db.governanceObservation.delete({ where: { id: body.id } });
    await audit(parseInt(user.id, 10), "DELETE_GOV_OBSERVATION", "GovernanceObservation", body.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
