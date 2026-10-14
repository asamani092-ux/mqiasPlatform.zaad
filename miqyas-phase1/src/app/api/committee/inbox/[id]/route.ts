import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const STORAGE_DIR = path.join(process.cwd(), "storage", "committee");

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    if (!can.viewCommittee(user)) return jsonError("غير مصرح", 403);
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return jsonError("معرف غير صالح", 400);
    const upload = await db.externalAuditUpload.findUnique({ where: { id } });
    if (!upload) return jsonError("الملف غير موجود", 404);

    const filePath = path.resolve(STORAGE_DIR, path.basename(upload.storedName));
    if (!filePath.startsWith(path.resolve(STORAGE_DIR) + path.sep)) {
      return jsonError("غير مصرح", 403);
    }
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": upload.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(upload.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
