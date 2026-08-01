/**
 * تحقق من نوع الملف عبر البصمة الثنائية (magic bytes) — لا يُكتفى بامتداد الاسم
 * أو نوع MIME القادمين من العميل.
 */

const SIGNATURES: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  jpg: [[0xff, 0xd8, 0xff]],
  jpeg: [[0xff, 0xd8, 0xff]],
  // OOXML (xlsx/docx) = أرشيف ZIP
  xlsx: [[0x50, 0x4b, 0x03, 0x04]],
  docx: [[0x50, 0x4b, 0x03, 0x04]],
  // Excel القديم (OLE2)
  xls: [
    [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
    [0x50, 0x4b, 0x03, 0x04],
  ],
};

export function matchesFileSignature(buffer: Buffer, ext: string): boolean {
  const candidates = SIGNATURES[ext.toLowerCase()];
  if (!candidates) return false;
  return candidates.some(
    (sig) => buffer.length >= sig.length && sig.every((b, i) => buffer[i] === b),
  );
}
