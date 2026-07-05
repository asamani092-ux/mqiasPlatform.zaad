import { z } from "zod";
import type { Frequency, KpiType, Polarity } from "@prisma/client";

export const kpiBodySchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(500),
  type: z.enum(["STRATEGIC", "OPERATIONAL"]),
  unit: z.string().min(1).max(100),
  polarity: z.enum(["HIGHER_BETTER", "LOWER_BETTER"]).default("HIGHER_BETTER"),
  frequency: z.enum(["QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]).default("QUARTERLY"),
  requiredData: z.string().max(2000).optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  sectionId: z.number().int().positive().optional().nullable(),
  ownerLabel: z.string().max(500).optional().nullable(),
  ownerId: z.number().int().positive().optional().nullable(),
  baseline: z.number().optional().nullable(),
  annualTarget: z.number().optional().nullable(),
  strategicGoalId: z.number().int().positive().optional().nullable(),
  operationalGoalId: z.number().int().positive().optional().nullable(),
  recommendation: z.string().max(5000).optional().nullable(),
  measureFormula: z.string().max(2000).optional().nullable(),
});

export const kpiUpdateSchema = kpiBodySchema.partial().extend({
  active: z.boolean().optional(),
});

export const targetSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  period: z.enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"]),
  targetValue: z.number(),
});

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  QUARTERLY: "ربع سنوي",
  SEMI_ANNUAL: "نصف سنوي",
  ANNUAL: "سنوي",
};

export const TYPE_LABEL: Record<KpiType, string> = {
  STRATEGIC: "استراتيجي",
  OPERATIONAL: "تشغيلي",
};

export const POLARITY_LABEL_API: Record<Polarity, string> = {
  HIGHER_BETTER: "كلما زاد كان أفضل",
  LOWER_BETTER: "كلما قل كان أفضل",
};
