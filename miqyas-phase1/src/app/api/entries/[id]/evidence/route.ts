import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const STORAGE_DIR = path.join(process.cwd(), "storage", "evidence");
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    const userId = parseInt(user.id, 10);
    const entryId = parseInt(params.id, 10);
    if (Number.isNaN(entryId)) return jsonError("معرف غير صالح", 400);

    const entry = await db.kpiEntry.findUnique({
      where: { id: entryId },
      include: { kpi: { select: { ownerId: true } } },
    });

    if (!entry) return jsonError("الإدخال غير موجود", 404);
    if (entry.kpi.ownerId !== userId) return jsonError("غير مصرح", 403);

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) return jsonError("لم يُرفَع ملف", 400);

    if (file.size > MAX_SIZE) return jsonError("حجم الملف يتجاوز 10 ميغابايت", 400);

    const ext = extOf(file.name);
    const allowedMimes = ALLOWED[ext];
    if (!allowedMimes) return jsonError("نوع الملف غير مسموح", 400);
    if (!allowedMimes.includes(file.type)) {
      return jsonError("نوع MIME غير مطابق للامتداد", 400);
    }

    await mkdir(STORAGE_DIR, { recursive: true });
    const storedName = `${randomBytes(16).toString("hex")}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(STORAGE_DIR, storedName), buffer);

    const evidence = await db.evidence.create({
      data: {
        kpiEntryId: entryId,
        fileName: file.name,
        storedName,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedById: userId,
      },
    });

    await audit(userId, "UPLOAD_EVIDENCE", "Evidence", evidence.id, { entryId });

    return NextResponse.json({ evidence });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    const userId = parseInt(user.id, 10);
    const entryId = parseInt(params.id, 10);
    const evidenceId = parseInt(req.nextUrl.searchParams.get("evidenceId") ?? "", 10);

    if (Number.isNaN(entryId) || Number.isNaN(evidenceId)) {
      return jsonError("معرف غير صالح", 400);
    }

    const entry = await db.kpiEntry.findUnique({
      where: { id: entryId },
      include: { kpi: { select: { ownerId: true } } },
    });

    if (!entry) return jsonError("الإدخال غير موجود", 404);
    if (entry.kpi.ownerId !== userId) return jsonError("غير مصرح", 403);
    if (entry.approvalStatus === "APPROVED") {
      return jsonError("لا يمكن حذف الشواهد بعد الاعتماد", 400);
    }

    const evidence = await db.evidence.findFirst({
      where: { id: evidenceId, kpiEntryId: entryId },
    });

    if (!evidence) return jsonError("الشاهد غير موجود", 404);

    try {
      await unlink(path.join(STORAGE_DIR, evidence.storedName));
    } catch {
      /* الملف قد يكون محذوفًا مسبقًا */
    }

    await db.evidence.delete({ where: { id: evidenceId } });
    await audit(userId, "DELETE_EVIDENCE", "Evidence", evidenceId, { entryId });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
