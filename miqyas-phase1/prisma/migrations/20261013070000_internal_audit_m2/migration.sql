-- AlterEnum Role
ALTER TYPE "Role" ADD VALUE 'INTERNAL_AUDITOR';

-- CreateEnum
CREATE TYPE "AuditPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
CREATE TYPE "AuditEngagementStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'REPORTING', 'CLOSED');
CREATE TYPE "AuditFindingStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');
CREATE TYPE "AuditFindingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "AuditReportStatus" AS ENUM ('DRAFT', 'ISSUED');
CREATE TYPE "AuditDocVisibility" AS ENUM ('INTERNAL_ONLY', 'TEAM_AND_ADMIN');

-- CreateTable
CREATE TABLE "AuditYearPlan" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "AuditPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditYearPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEngagement" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "departmentId" INTEGER,
    "sectionId" INTEGER,
    "status" "AuditEngagementStatus" NOT NULL DEFAULT 'PLANNED',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditEngagement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditFinding" (
    "id" SERIAL NOT NULL,
    "engagementId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "AuditFindingSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "AuditFindingStatus" NOT NULL DEFAULT 'OPEN',
    "departmentId" INTEGER,
    "riskNote" TEXT,
    "createdById" INTEGER NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditCorrectiveAction" (
    "id" SERIAL NOT NULL,
    "findingId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "responsibleId" INTEGER,
    "responsibleName" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditCorrectiveAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditWorkingPaper" (
    "id" SERIAL NOT NULL,
    "engagementId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "visibility" "AuditDocVisibility" NOT NULL DEFAULT 'INTERNAL_ONLY',
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditWorkingPaper_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditReport" (
    "id" SERIAL NOT NULL,
    "engagementId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" "AuditReportStatus" NOT NULL DEFAULT 'DRAFT',
    "fileName" TEXT,
    "storedName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "issuedAt" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditReport_pkey" PRIMARY KEY ("id")
);

-- Indexes / unique
CREATE UNIQUE INDEX "AuditYearPlan_year_key" ON "AuditYearPlan"("year");
CREATE INDEX "AuditEngagement_planId_idx" ON "AuditEngagement"("planId");
CREATE INDEX "AuditEngagement_departmentId_idx" ON "AuditEngagement"("departmentId");
CREATE INDEX "AuditEngagement_status_idx" ON "AuditEngagement"("status");
CREATE INDEX "AuditFinding_engagementId_idx" ON "AuditFinding"("engagementId");
CREATE INDEX "AuditFinding_status_idx" ON "AuditFinding"("status");
CREATE INDEX "AuditFinding_severity_idx" ON "AuditFinding"("severity");
CREATE INDEX "AuditCorrectiveAction_findingId_idx" ON "AuditCorrectiveAction"("findingId");
CREATE INDEX "AuditCorrectiveAction_status_idx" ON "AuditCorrectiveAction"("status");
CREATE INDEX "AuditWorkingPaper_engagementId_idx" ON "AuditWorkingPaper"("engagementId");
CREATE INDEX "AuditReport_engagementId_idx" ON "AuditReport"("engagementId");
CREATE INDEX "AuditReport_status_idx" ON "AuditReport"("status");

-- FKs
ALTER TABLE "AuditYearPlan" ADD CONSTRAINT "AuditYearPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditEngagement" ADD CONSTRAINT "AuditEngagement_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AuditYearPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEngagement" ADD CONSTRAINT "AuditEngagement_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditEngagement" ADD CONSTRAINT "AuditEngagement_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditEngagement" ADD CONSTRAINT "AuditEngagement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "AuditEngagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditCorrectiveAction" ADD CONSTRAINT "AuditCorrectiveAction_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "AuditFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditCorrectiveAction" ADD CONSTRAINT "AuditCorrectiveAction_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditWorkingPaper" ADD CONSTRAINT "AuditWorkingPaper_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "AuditEngagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditWorkingPaper" ADD CONSTRAINT "AuditWorkingPaper_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditReport" ADD CONSTRAINT "AuditReport_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "AuditEngagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditReport" ADD CONSTRAINT "AuditReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
