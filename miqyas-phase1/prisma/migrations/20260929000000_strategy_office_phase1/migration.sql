-- CreateEnum
CREATE TYPE "MeasurementDomain" AS ENUM ('STRATEGIC', 'OPERATIONAL', 'GOVERNANCE');

-- AlterTable Kpi
ALTER TABLE "Kpi" ADD COLUMN "domain" "MeasurementDomain" NOT NULL DEFAULT 'STRATEGIC';

-- Backfill domain from type
UPDATE "Kpi" SET "domain" = 'OPERATIONAL' WHERE "type" = 'OPERATIONAL';
UPDATE "Kpi" SET "domain" = 'STRATEGIC' WHERE "type" = 'STRATEGIC';

-- AlterTable MeasurementRequirement
ALTER TABLE "MeasurementRequirement" ADD COLUMN "domain" "MeasurementDomain" NOT NULL DEFAULT 'STRATEGIC';

UPDATE "MeasurementRequirement" mr
SET "domain" = k."domain"
FROM "Kpi" k
WHERE k."requirementId" = mr."id";

UPDATE "MeasurementRequirement" mr
SET "domain" = 'OPERATIONAL'
WHERE mr."domain" = 'STRATEGIC'
  AND EXISTS (SELECT 1 FROM "Kpi" k WHERE k."requirementId" = mr."id" AND k."type" = 'OPERATIONAL');

-- AlterTable GovernanceRequirement — ربط اختياري تراكمي
ALTER TABLE "GovernanceRequirement" ADD COLUMN "measurementRequirementId" INTEGER;

-- CreateTable CalendarEvent
CREATE TABLE "CalendarEvent" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "eventType" TEXT NOT NULL DEFAULT 'GENERAL',
    "notes" TEXT,
    "departmentId" INTEGER,
    "sectionId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Kpi_domain_idx" ON "Kpi"("domain");
CREATE INDEX "MeasurementRequirement_domain_idx" ON "MeasurementRequirement"("domain");
CREATE INDEX "GovernanceRequirement_measurementRequirementId_idx" ON "GovernanceRequirement"("measurementRequirementId");
CREATE INDEX "CalendarEvent_startsAt_idx" ON "CalendarEvent"("startsAt");
CREATE INDEX "CalendarEvent_departmentId_idx" ON "CalendarEvent"("departmentId");
CREATE INDEX "CalendarEvent_sectionId_idx" ON "CalendarEvent"("sectionId");

-- FKs
ALTER TABLE "GovernanceRequirement" ADD CONSTRAINT "GovernanceRequirement_measurementRequirementId_fkey" FOREIGN KEY ("measurementRequirementId") REFERENCES "MeasurementRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
