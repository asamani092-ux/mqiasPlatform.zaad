import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { syncKpiEntriesFromMeasurement } from "@/lib/measurement-sync";
import { canFillerEdit } from "@/lib/approval-status";
import { matchesFileSignature } from "@/lib/file-signature";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import {
  isMeasurementRoundOpen,
  ROUND_CLOSED_UPLOAD_MSG,
} from "@/lib/measurement-round";

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
    const measurementPeriodId = parseInt(params.id, 10);
    if (Number.isNaN(measurementPeriodId)) return jsonError("معرف غير صالح", 400);

    if (!(await isMeasurementRoundOpen())) {
      return jsonError(ROUND_CLOSED_UPLOAD_MSG, 400);
    }

    const mp = await db.measurementPeriod.findUnique({
      where: { id: measurementPeriodId },
      include: {
        requirement: { select: { ownerId: true } },
      },
    });

    if (!mp) return jsonError("فترة القياس غير موجودة", 404);
    if (mp.requirement.ownerId !== userId && user.role !== "SYSTEM_ADMIN") {
      return jsonError("غير مصرح", 403);
    }
    if (user.role !== "SYSTEM_ADMIN" && !canFillerEdit(mp.approvalStatus)) {
      return jsonError("لا يمكن رفع شواهد والقياس في هذه الحالة", 400);
    }

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

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesFileSignature(buffer, ext)) {
      return jsonError("محتوى الملف لا يطابق نوعه المعلن", 400);
    }

    await mkdir(STORAGE_DIR, { recursive: true });
    const storedName = `${randomBytes(16).toString("hex")}.${ext}`;
    await writeFile(path.join(STORAGE_DIR, storedName), buffer);

    const evidence = await db.evidence.create({
      data: {
        measurementPeriodId,
        fileName: file.name,
        storedName,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedById: userId,
        status: "ACTIVE",
      },
    });

    await syncKpiEntriesFromMeasurement(measurementPeriodId);

    await audit(userId, "UPLOAD_EVIDENCE", "Evidence", evidence.id, {
      measurementPeriodId,
    });

    return NextResponse.json({ evidence });
  } catch (e) {
    return handleApiError(e);
  }
}

/** حذف نهائي — السجل + الملف · فقط رافع الشاهد · O(1) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    const userId = parseInt(user.id, 10);
    const measurementPeriodId = parseInt(params.id, 10);
    const evidenceId = parseInt(req.nextUrl.searchParams.get("evidenceId") ?? "", 10);

    if (Number.isNaN(measurementPeriodId) || Number.isNaN(evidenceId)) {
      return jsonError("معرف غير صالح", 400);
    }

    if (!(await isMeasurementRoundOpen())) {
      return jsonError(ROUND_CLOSED_UPLOAD_MSG, 400);
    }

    const mp = await db.measurementPeriod.findUnique({
      where: { id: measurementPeriodId },
      include: {
        requirement: { select: { ownerId: true } },
      },
    });

    if (!mp) return jsonError("فترة القياس غير موجودة", 404);
    if (!canFillerEdit(mp.approvalStatus)) {
      return jsonError(
        "لا يمكن حذف الشواهد بعد التقديم — الحذف متاح في المسودة أو بعد الإرجاع/الرفض فقط",
        400,
      );
    }

    const evidence = await db.evidence.findFirst({
      where: { id: evidenceId, measurementPeriodId, status: "ACTIVE" },
    });

    if (!evidence) return jsonError("الشاهد غير موجود", 404);
    if (evidence.uploadedById !== userId) {
      return jsonError("حذف الشاهد متاح فقط لمن رفعه", 403);
    }

    const filePath = path.join(STORAGE_DIR, evidence.storedName);
    await db.evidence.delete({ where: { id: evidenceId } });
    try {
      await unlink(filePath);
    } catch {
      // الملف قد يكون مفقودًا على القرص — السجل حُذف من القاعدة
    }

    await syncKpiEntriesFromMeasurement(measurementPeriodId);
    await audit(userId, "DELETE_EVIDENCE", "Evidence", evidenceId, {
      measurementPeriodId,
      hard: true,
      storedName: evidence.storedName,
    });

    return NextResponse.json({ ok: true, deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
