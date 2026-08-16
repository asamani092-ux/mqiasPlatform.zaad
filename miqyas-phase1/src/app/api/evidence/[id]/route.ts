import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import {
  isInlineEvidenceMime,
  resolveEvidenceMime,
} from "@/lib/evidence-preview";

const STORAGE_DIR = path.join(process.cwd(), "storage", "evidence");

async function canDownload(
  userId: number,
  role: string,
  userSectionId: number | null,
  userDepartmentId: number | null,
  evidenceId: number,
): Promise<{ ok: boolean; evidence?: { storedName: string; fileName: string; mimeType: string } }> {
  const evidence = await db.evidence.findUnique({
    where: { id: evidenceId },
    include: {
      entry: {
        include: {
          kpi: { select: { ownerId: true, sectionId: true, departmentId: true } },
        },
      },
      measurementPeriod: {
        include: {
          requirement: {
            select: {
              ownerId: true,
              sectionId: true,
              departmentId: true,
              owner: { select: { sectionId: true } },
            },
          },
        },
      },
      uploadedBy: { select: { id: true, sectionId: true, departmentId: true } },
    },
  });

  if (!evidence) return { ok: false };

  const mimeType = resolveEvidenceMime(evidence.mimeType, evidence.fileName);
  const meta = {
    storedName: evidence.storedName,
    fileName: evidence.fileName,
    mimeType,
  };

  if (role === "SYSTEM_ADMIN" || role === "EXECUTIVE") {
    return { ok: true, evidence: meta };
  }

  if (evidence.uploadedById === userId) {
    return { ok: true, evidence: meta };
  }

  const kpi = evidence.entry?.kpi;
  if (kpi) {
    if (kpi.ownerId === userId) return { ok: true, evidence: meta };
    if (role === "SECTION_HEAD" && userSectionId != null && kpi.sectionId === userSectionId) {
      return { ok: true, evidence: meta };
    }
    if (role === "DEPT_MANAGER" && userDepartmentId != null && kpi.departmentId === userDepartmentId) {
      return { ok: true, evidence: meta };
    }
  }

  const req = evidence.measurementPeriod?.requirement;
  if (req) {
    if (req.ownerId === userId) return { ok: true, evidence: meta };
    if (role === "SECTION_HEAD" && userSectionId != null) {
      const sectionMatch =
        req.sectionId === userSectionId || req.owner?.sectionId === userSectionId;
      if (sectionMatch) return { ok: true, evidence: meta };
    }
    if (role === "DEPT_MANAGER" && userDepartmentId != null && req.departmentId === userDepartmentId) {
      return { ok: true, evidence: meta };
    }
  }

  return { ok: false };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    const userId = parseInt(user.id, 10);
    const evidenceId = parseInt(params.id, 10);
    if (Number.isNaN(evidenceId)) return jsonError("معرف غير صالح", 400);

    const check = await canDownload(
      userId,
      user.role,
      user.sectionId,
      user.departmentId,
      evidenceId,
    );
    if (!check.ok || !check.evidence) return jsonError("غير مصرح", 403);

    // احتواء المسار: basename + تحقق أن الناتج داخل مجلد التخزين
    const filePath = path.resolve(STORAGE_DIR, path.basename(check.evidence.storedName));
    if (!filePath.startsWith(path.resolve(STORAGE_DIR) + path.sep)) {
      return jsonError("غير مصرح", 403);
    }
    const buffer = await readFile(filePath);

    const forceDownload = req.nextUrl.searchParams.get("download") === "1";
    const wantInline =
      !forceDownload &&
      (req.nextUrl.searchParams.get("inline") === "1" ||
        req.nextUrl.searchParams.get("inline") == null);
    const canInline = wantInline && isInlineEvidenceMime(check.evidence.mimeType);
    const disposition = canInline
      ? `inline; filename*=UTF-8''${encodeURIComponent(check.evidence.fileName)}`
      : `attachment; filename*=UTF-8''${encodeURIComponent(check.evidence.fileName)}`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": check.evidence.mimeType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
