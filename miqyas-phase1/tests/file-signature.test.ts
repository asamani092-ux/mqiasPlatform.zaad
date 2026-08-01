import { describe, expect, it } from "vitest";
import { matchesFileSignature } from "@/lib/file-signature";

describe("file-signature", () => {
  it("يقبل PDF حقيقي ويرفض PDF مزيف", () => {
    expect(matchesFileSignature(Buffer.from("%PDF-1.7 ..."), "pdf")).toBe(true);
    expect(matchesFileSignature(Buffer.from("<script>alert(1)</script>"), "pdf")).toBe(false);
  });

  it("يقبل PNG/JPG ببصمتهما فقط", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(matchesFileSignature(png, "png")).toBe(true);
    expect(matchesFileSignature(jpg, "jpg")).toBe(true);
    expect(matchesFileSignature(jpg, "jpeg")).toBe(true);
    expect(matchesFileSignature(png, "jpg")).toBe(false);
    expect(matchesFileSignature(jpg, "png")).toBe(false);
  });

  it("xlsx/docx = أرشيف ZIP · xls يقبل OLE2 وZIP", () => {
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14]);
    const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    expect(matchesFileSignature(zip, "xlsx")).toBe(true);
    expect(matchesFileSignature(zip, "docx")).toBe(true);
    expect(matchesFileSignature(zip, "xls")).toBe(true);
    expect(matchesFileSignature(ole, "xls")).toBe(true);
    expect(matchesFileSignature(ole, "xlsx")).toBe(false);
  });

  it("امتداد غير معروف أو ملف قصير = رفض", () => {
    expect(matchesFileSignature(Buffer.from("anything"), "exe")).toBe(false);
    expect(matchesFileSignature(Buffer.from([0x25]), "pdf")).toBe(false);
    expect(matchesFileSignature(Buffer.alloc(0), "png")).toBe(false);
  });
});
