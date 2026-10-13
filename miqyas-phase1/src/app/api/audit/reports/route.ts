import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { matchesFileSignature } from "@/lib/file-signature";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const STORAGE_DIR = path.join(process.cwd(), "storage", "audit");
const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
};

function extOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

const jsonCreateSchema = z.object({
  engagementId: z.number().int().positive(),
  title: z.string().trim().min(2).max(300),
  summary: z.string().max(8000).optional().nullable(),
  status: z.enum(["DRAFT", "ISSUED"]).optional(),
});

const jsonUpdateSchema = jsonCreateSchema.partial().extend({
  id: z.number().int().positive(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.viewAuditOffice(user)) return jsonError("غير مصرح", 403);

    const issuedOnly = !can.manageAuditReports(user);
    const engagementIdRaw = req.nextUrl.searchParams.get("engagementId");
    const engagementId = engagementIdRaw ? parseInt(engagementIdRaw, 10) : null;

    const reports = await db.auditReport.findMany({
      where: {
        ...(engagementId != null && !Number.isNaN(engagementId) ? { engagementId } : {}),
        ...(issuedOnly ? { status: "ISSUED" as const } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        engagement: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    const engagements = can.manageAuditReports(user)
      ? await db.auditEngagement.findMany({
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true },
          take: 200,
        })
      : [];

    return NextResponse.json({
      reports,
      engagements,
      canManage: can.manageAuditReports(user),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageAuditReports(user)) return jsonError("غير مصرح", 403);

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const title = String(form.get("title") ?? "").trim();
      const summary = String(form.get("summary") ?? "").trim() || null;
      const engagementId = parseInt(String(form.get("engagementId") ?? ""), 10);
      const statusRaw = String(form.get("status") ?? "DRAFT");
      const status = statusRaw === "ISSUED" ? "ISSUED" : "DRAFT";
      const file = form.get("file");

      if (!title || Number.isNaN(engagementId)) return jsonError("بيانات غير صالحة", 400);
      const engagement = await db.auditEngagement.findUnique({ where: { id: engagementId } });
      if (!engagement) return jsonError("المهمة غير موجودة", 404);

      let fileName: string | null = null;
      let storedName: string | null = null;
      let mimeType: string | null = null;
      let sizeBytes: number | null = null;

      if (file && file instanceof File && file.size > 0) {
        if (file.size > MAX_SIZE) return jsonError("حجم الملف يتجاوز 10 ميغابايت", 400);
        const ext = extOf(file.name);
        const allowedMimes = ALLOWED[ext];
        if (!allowedMimes || !allowedMimes.includes(file.type)) {
          return jsonError("نوع الملف غير مسموح", 400);
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        if (!matchesFileSignature(buffer, ext)) {
          return jsonError("محتوى الملف لا يطابق نوعه المعلن", 400);
        }
        await mkdir(STORAGE_DIR, { recursive: true });
        storedName = `report-${randomBytes(16).toString("hex")}.${ext}`;
        await writeFile(path.join(STORAGE_DIR, storedName), buffer);
        fileName = file.name;
        mimeType = file.type;
        sizeBytes = file.size;
      }

      const report = await db.auditReport.create({
        data: {
          engagementId,
          title,
          summary,
          status,
          fileName,
          storedName,
          mimeType,
          sizeBytes,
          issuedAt: status === "ISSUED" ? new Date() : null,
          createdById: parseInt(user.id, 10),
        },
      });

      await audit(parseInt(user.id, 10), "CREATE_AUDIT_REPORT", "AuditReport", report.id);
      return NextResponse.json({ report }, { status: 201 });
    }

    const body = jsonCreateSchema.parse(await req.json());
    const engagement = await db.auditEngagement.findUnique({ where: { id: body.engagementId } });
    if (!engagement) return jsonError("المهمة غير موجودة", 404);

    const status = body.status ?? "DRAFT";
    const report = await db.auditReport.create({
      data: {
        engagementId: body.engagementId,
        title: body.title,
        summary: body.summary ?? null,
        status,
        issuedAt: status === "ISSUED" ? new Date() : null,
        createdById: parseInt(user.id, 10),
      },
    });

    await audit(parseInt(user.id, 10), "CREATE_AUDIT_REPORT", "AuditReport", report.id);
    return NextResponse.json({ report }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageAuditReports(user)) return jsonError("غير مصرح", 403);

    const body = jsonUpdateSchema.parse(await req.json());
    const existing = await db.auditReport.findUnique({ where: { id: body.id } });
    if (!existing) return jsonError("التقرير غير موجود", 404);

    const report = await db.auditReport.update({
      where: { id: body.id },
      data: {
        ...(body.title != null ? { title: body.title } : {}),
        ...(body.summary !== undefined ? { summary: body.summary } : {}),
        ...(body.engagementId != null ? { engagementId: body.engagementId } : {}),
        ...(body.status != null
          ? {
              status: body.status,
              issuedAt:
                body.status === "ISSUED" ? existing.issuedAt ?? new Date() : null,
            }
          : {}),
      },
    });

    await audit(parseInt(user.id, 10), "UPDATE_AUDIT_REPORT", "AuditReport", report.id, body);
    return NextResponse.json({ report });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
