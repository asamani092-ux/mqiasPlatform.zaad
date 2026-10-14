import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, isAuditTeam } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { matchesFileSignature } from "@/lib/file-signature";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const STORAGE_DIR = path.join(process.cwd(), "storage", "committee");
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
};

function extOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

const ackSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["PENDING_REVIEW", "ACKNOWLEDGED"]),
});

function canUploadExternal(user: Parameters<typeof can.manageCommittee>[0]) {
  return can.manageCommittee(user) || isAuditTeam(user);
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!can.viewCommittee(user)) return jsonError("غير مصرح", 403);

    const [reports, uploads, meetings] = await Promise.all([
      db.auditReport.findMany({
        where: { status: "ISSUED" },
        orderBy: { issuedAt: "desc" },
        take: 100,
        select: {
          id: true,
          title: true,
          summary: true,
          issuedAt: true,
          fileName: true,
          engagement: { select: { id: true, title: true } },
        },
      }),
      db.externalAuditUpload.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          uploadedBy: { select: { id: true, name: true } },
          meeting: { select: { id: true, title: true } },
          report: { select: { id: true, title: true } },
        },
      }),
      db.committeeMeeting.findMany({
        orderBy: { scheduledAt: "desc" },
        select: { id: true, title: true },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      reports,
      uploads,
      meetings,
      canManage: can.manageCommittee(user),
      canUpload: canUploadExternal(user),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!canUploadExternal(user)) return jsonError("غير مصرح", 403);

    const form = await req.formData();
    const file = form.get("file");
    const title = String(form.get("title") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim() || null;
    const meetingRaw = String(form.get("meetingId") ?? "");
    const reportRaw = String(form.get("reportId") ?? "");
    const meetingId = meetingRaw ? parseInt(meetingRaw, 10) : null;
    const reportId = reportRaw ? parseInt(reportRaw, 10) : null;

    if (!file || !(file instanceof File)) return jsonError("لم يُرفَع ملف", 400);
    if (!title) return jsonError("العنوان مطلوب", 400);
    if (file.size > MAX_SIZE) return jsonError("حجم الملف يتجاوز 10 ميغابايت", 400);

    const ext = extOf(file.name);
    const allowed = ALLOWED[ext];
    if (!allowed || !allowed.includes(file.type)) return jsonError("نوع الملف غير مسموح", 400);
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesFileSignature(buffer, ext)) return jsonError("محتوى الملف لا يطابق نوعه", 400);

    await mkdir(STORAGE_DIR, { recursive: true });
    const storedName = `${randomBytes(16).toString("hex")}.${ext}`;
    await writeFile(path.join(STORAGE_DIR, storedName), buffer);

    const upload = await db.externalAuditUpload.create({
      data: {
        title,
        notes,
        fileName: file.name,
        storedName,
        mimeType: file.type,
        sizeBytes: file.size,
        meetingId: meetingId && !Number.isNaN(meetingId) ? meetingId : null,
        reportId: reportId && !Number.isNaN(reportId) ? reportId : null,
        uploadedById: parseInt(user.id, 10),
      },
    });

    await audit(parseInt(user.id, 10), "UPLOAD_EXTERNAL_AUDIT", "ExternalAuditUpload", upload.id);
    return NextResponse.json({ upload }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!can.manageCommittee(user)) return jsonError("غير مصرح", 403);
    const body = ackSchema.parse(await req.json());
    const upload = await db.externalAuditUpload.update({
      where: { id: body.id },
      data: { status: body.status },
    });
    await audit(parseInt(user.id, 10), "ACK_EXTERNAL_AUDIT", "ExternalAuditUpload", upload.id);
    return NextResponse.json({ upload });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("بيانات غير صالحة", 400);
    return handleApiError(e);
  }
}
