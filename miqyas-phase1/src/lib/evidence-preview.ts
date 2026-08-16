/** مساعدات معاينة الشواهد — O(1) زمن/مساحة */

const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const INLINE_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export function extOfFileName(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

/** يوحّد MIME من الحقل أو الامتداد عند الفراغ/octet-stream */
export function resolveEvidenceMime(mimeType: string | null | undefined, fileName: string): string {
  const raw = (mimeType ?? "").trim().toLowerCase();
  if (raw && raw !== "application/octet-stream") return raw;
  return EXT_MIME[extOfFileName(fileName)] ?? raw;
}

export function isInlineEvidenceMime(mime: string): boolean {
  return INLINE_MIME.has(mime.toLowerCase());
}

export function isPreviewableEvidence(mimeType?: string | null, fileName?: string): boolean {
  const mime = resolveEvidenceMime(mimeType, fileName ?? "");
  return isInlineEvidenceMime(mime) || mime.startsWith("image/");
}

export function evidencePreviewUrl(id: number): string {
  return `/api/evidence/${id}?inline=1`;
}

export function evidenceDownloadUrl(id: number): string {
  return `/api/evidence/${id}?download=1`;
}
