import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-helpers";

const STORAGE_DIR = path.join(process.cwd(), "storage", "evidence");

async function canDownload(
  userId: number,
  role: string,
  userSectionId: number | null,
  evidenceId: number,
): Promise<{ ok: boolean; evidence?: { storedName: string; fileName: string; mimeType: string } }> {
  const evidence = await db.evidence.findUnique({
    where: { id: evidenceId },
    include: {
      entry: {
        include: {
          kpi: { select: { ownerId: true, sectionId: true } },
        },
      },
    },
  });

  if (!evidence) return { ok: false };

  const kpi = evidence.entry.kpi;
  if (kpi.ownerId === userId) {
    return { ok: true, evidence: { storedName: evidence.storedName, fileName: evidence.fileName, mimeType: evidence.mimeType } };
  }
  if (role === "SYSTEM_ADMIN" || role === "EXECUTIVE") {
    return { ok: true, evidence: { storedName: evidence.storedName, fileName: evidence.fileName, mimeType: evidence.mimeType } };
  }
  if (role === "SECTION_HEAD" && userSectionId != null && kpi.sectionId === userSectionId) {
    return { ok: true, evidence: { storedName: evidence.storedName, fileName: evidence.fileName, mimeType: evidence.mimeType } };
  }

  return { ok: false };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    const userId = parseInt(user.id, 10);
    const evidenceId = parseInt(params.id, 10);
    if (Number.isNaN(evidenceId)) return jsonError("معرف غير صالح", 400);

    const check = await canDownload(userId, user.role, user.sectionId, evidenceId);
    if (!check.ok || !check.evidence) return jsonError("غير مصرح", 403);

    const filePath = path.join(STORAGE_DIR, check.evidence.storedName);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": check.evidence.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(check.evidence.fileName)}`,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
