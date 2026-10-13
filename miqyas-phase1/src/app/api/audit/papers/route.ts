import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
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
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

function extOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageAuditPapers(user)) return jsonError("غير مصرح — أوراق العمل للفريق فقط", 403);

    const engagementIdRaw = req.nextUrl.searchParams.get("engagementId");
    const engagementId = engagementIdRaw ? parseInt(engagementIdRaw, 10) : null;
    const where =
      engagementId != null && !Number.isNaN(engagementId) ? { engagementId } : {};

    const papers = await db.auditWorkingPaper.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        engagement: { select: { id: true, title: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    const engagements = await db.auditEngagement.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
      take: 200,
    });

    return NextResponse.json({ papers, engagements, canManage: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageAuditPapers(user)) return jsonError("غير مصرح", 403);

    const form = await req.formData();
    const file = form.get("file");
    const title = String(form.get("title") ?? "").trim();
    const engagementId = parseInt(String(form.get("engagementId") ?? ""), 10);

    if (!file || !(file instanceof File)) return jsonError("لم يُرفَع ملف", 400);
    if (!title) return jsonError("العنوان مطلوب", 400);
    if (Number.isNaN(engagementId)) return jsonError("مهمة غير صالحة", 400);

    const engagement = await db.auditEngagement.findUnique({ where: { id: engagementId } });
    if (!engagement) return jsonError("المهمة غير موجودة", 404);

    if (file.size > MAX_SIZE) return jsonError("حجم الملف يتجاوز 10 ميغابايت", 400);
    const ext = extOf(file.name);
    const allowedMimes = ALLOWED[ext];
    if (!allowedMimes) return jsonError("نوع الملف غير مسموح", 400);
    if (!allowedMimes.includes(file.type)) return jsonError("نوع MIME غير مطابق", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesFileSignature(buffer, ext)) {
      return jsonError("محتوى الملف لا يطابق نوعه المعلن", 400);
    }

    await mkdir(STORAGE_DIR, { recursive: true });
    const storedName = `${randomBytes(16).toString("hex")}.${ext}`;
    await writeFile(path.join(STORAGE_DIR, storedName), buffer);

    const paper = await db.auditWorkingPaper.create({
      data: {
        engagementId,
        title,
        fileName: file.name,
        storedName,
        mimeType: file.type,
        sizeBytes: file.size,
        visibility: "INTERNAL_ONLY",
        uploadedById: parseInt(user.id, 10),
      },
    });

    await audit(parseInt(user.id, 10), "UPLOAD_AUDIT_PAPER", "AuditWorkingPaper", paper.id, {
      engagementId,
    });

    return NextResponse.json({ paper }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageAuditPapers(user)) return jsonError("غير مصرح", 403);

    const id = parseInt(req.nextUrl.searchParams.get("id") ?? "", 10);
    if (Number.isNaN(id)) return jsonError("معرف غير صالح", 400);

    const paper = await db.auditWorkingPaper.findUnique({ where: { id } });
    if (!paper) return jsonError("ورقة العمل غير موجودة", 404);

    await db.auditWorkingPaper.delete({ where: { id } });
    try {
      await unlink(path.join(STORAGE_DIR, path.basename(paper.storedName)));
    } catch {
      /* الملف قد يكون محذوفاً مسبقاً */
    }

    await audit(parseInt(user.id, 10), "DELETE_AUDIT_PAPER", "AuditWorkingPaper", id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
