import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { handleApiError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const STORAGE_DIR = path.join(process.cwd(), "storage", "audit");

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    if (!can.manageAuditPapers(user)) return jsonError("غير مصرح — أوراق العمل للفريق فقط", 403);

    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return jsonError("معرف غير صالح", 400);

    const paper = await db.auditWorkingPaper.findUnique({ where: { id } });
    if (!paper) return jsonError("ورقة العمل غير موجودة", 404);

    const filePath = path.resolve(STORAGE_DIR, path.basename(paper.storedName));
    if (!filePath.startsWith(path.resolve(STORAGE_DIR) + path.sep)) {
      return jsonError("غير مصرح", 403);
    }

    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": paper.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(paper.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
