import { z } from "zod";
import type { ParsedImportRow } from "@/lib/import-excel";

export const importRowSchema = z.object({
  rowNum: z.number(),
  goalCode: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["STRATEGIC", "OPERATIONAL"]),
  unit: z.string(),
  polarity: z.enum(["HIGHER_BETTER", "LOWER_BETTER"]),
  frequency: z.enum(["QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]),
  requiredData: z.string(),
  ownerLabel: z.string().nullable(),
  departmentId: z.number().nullable(),
  baseline: z.number().nullable(),
  annualTarget: z.number().nullable(),
  period: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
  periodTarget: z.number().nullable(),
  actualValue: z.number().nullable(),
  whatHappened: z.string().nullable(),
  howHappened: z.string().nullable(),
  recommendation: z.string().nullable(),
  approvalStatus: z.enum(["APPROVED", "PENDING"]),
  status: z.enum(["NEW", "UPDATE", "ERROR"]),
  error: z.string().optional(),
});

export const confirmImportSchema = z.object({
  confirm: z.literal(true),
  year: z.number().int().optional(),
  rows: z.array(importRowSchema).min(1),
});

export type ValidatedImportRow = z.infer<typeof importRowSchema>;

export function validateImportRows(rows: ParsedImportRow[]): ValidatedImportRow[] {
  return rows
    .filter((r) => r.status !== "ERROR")
    .map((r) => importRowSchema.parse({ ...r, error: undefined }));
}
