-- AlterTable
ALTER TABLE "MeasurementPeriod" ADD COLUMN IF NOT EXISTS "reviewFeedback" JSONB;
