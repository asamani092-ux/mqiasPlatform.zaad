-- AlterTable
ALTER TABLE "Kpi" ADD COLUMN "requiredData" TEXT;

-- AlterTable
ALTER TABLE "KpiEntry" ADD COLUMN "deviationValue" DOUBLE PRECISION,
ADD COLUMN "whatHappened" TEXT,
ADD COLUMN "howHappened" TEXT,
ADD COLUMN "recommendation" TEXT;
