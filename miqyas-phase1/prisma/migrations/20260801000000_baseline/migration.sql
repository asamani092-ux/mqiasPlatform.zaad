-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SYSTEM_ADMIN', 'EXECUTIVE', 'DEPT_MANAGER', 'SECTION_HEAD', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "KpiType" AS ENUM ('STRATEGIC', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "Polarity" AS ENUM ('HIGHER_BETTER', 'LOWER_BETTER');

-- CreateEnum
CREATE TYPE "FillerRole" AS ENUM ('EMPLOYEE', 'SECTION_HEAD', 'DEPT_MANAGER');

-- CreateEnum
CREATE TYPE "Period" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'Y');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'INITIAL_APPROVED', 'FINAL_APPROVED', 'REJECTED_WORDING', 'REJECTED_EVIDENCE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalEventAction" AS ENUM ('SAVE_DRAFT', 'SUBMIT', 'INITIAL_APPROVE', 'FINAL_APPROVE', 'REJECT_WORDING', 'REJECT_EVIDENCE', 'RETURN_EDIT', 'ADMIN_EDIT');

-- CreateEnum
CREATE TYPE "KpiStatus" AS ENUM ('ACHIEVED', 'ON_TRACK', 'AT_RISK', 'CRITICAL', 'NO_DATA');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'LATE');

-- CreateEnum
CREATE TYPE "GovernanceStatus" AS ENUM ('COMPLIANT', 'PARTIAL', 'NON_COMPLIANT', 'PENDING');

-- CreateEnum
CREATE TYPE "ObservationStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'DRAFT', 'UNDER_REVIEW', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EARLY_WARNING', 'DEVIATION', 'APPROVAL_REQUEST', 'APPROVAL_RESULT', 'ACTION_LATE', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "departmentId" INTEGER,
    "sectionId" INTEGER,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "deptNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#8b1a2a',

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "sectionNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicGoal" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StrategicGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalGoal" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "strategicGoalId" INTEGER,

    CONSTRAINT "OperationalGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kpi" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "KpiType" NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '%',
    "baseline" DOUBLE PRECISION,
    "annualTarget" DOUBLE PRECISION,
    "frequency" "Frequency" NOT NULL DEFAULT 'QUARTERLY',
    "polarity" "Polarity" NOT NULL DEFAULT 'HIGHER_BETTER',
    "measureFormula" TEXT,
    "requiredData" TEXT,
    "departmentId" INTEGER,
    "sectionId" INTEGER,
    "ownerId" INTEGER,
    "ownerLabel" TEXT,
    "recommendation" TEXT,
    "strategicGoalId" INTEGER,
    "operationalGoalId" INTEGER,
    "requirementId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementRequirement" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '%',
    "polarity" "Polarity" NOT NULL DEFAULT 'HIGHER_BETTER',
    "frequency" "Frequency" NOT NULL DEFAULT 'QUARTERLY',
    "requiredData" TEXT,
    "departmentId" INTEGER,
    "sectionId" INTEGER,
    "ownerId" INTEGER,
    "fillerRole" "FillerRole" NOT NULL DEFAULT 'EMPLOYEE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasurementRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementPeriod" (
    "id" SERIAL NOT NULL,
    "requirementId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "period" "Period" NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "whatHappened" TEXT,
    "howHappened" TEXT,
    "note" TEXT,
    "enteredById" INTEGER NOT NULL,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "initialApprovedById" INTEGER,
    "initialApprovedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "suggestedWording" TEXT,
    "reviewFeedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasurementPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiTarget" (
    "id" SERIAL NOT NULL,
    "kpiId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "period" "Period" NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "KpiTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalEvent" (
    "id" SERIAL NOT NULL,
    "measurementPeriodId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,
    "action" "ApprovalEventAction" NOT NULL,
    "comment" TEXT,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiEntry" (
    "id" SERIAL NOT NULL,
    "kpiId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "period" "Period" NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "achievementPct" DOUBLE PRECISION,
    "deviationValue" DOUBLE PRECISION,
    "whatHappened" TEXT,
    "howHappened" TEXT,
    "recommendation" TEXT,
    "status" "KpiStatus" NOT NULL DEFAULT 'NO_DATA',
    "note" TEXT,
    "enteredById" INTEGER NOT NULL,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" SERIAL NOT NULL,
    "kpiEntryId" INTEGER,
    "measurementPeriodId" INTEGER,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'ACTIVE',
    "rejectReason" TEXT,
    "rejectedById" INTEGER,
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarlyWarningAlert" (
    "id" SERIAL NOT NULL,
    "kpiId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "period" "Period" NOT NULL,
    "expectedToDate" DOUBLE PRECISION NOT NULL,
    "actualToDate" DOUBLE PRECISION NOT NULL,
    "gapPct" DOUBLE PRECISION NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "recipients" TEXT NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarlyWarningAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviationCard" (
    "id" SERIAL NOT NULL,
    "kpiId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "period" "Period" NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "deviationPct" DOUBLE PRECISION NOT NULL,
    "reasons" TEXT NOT NULL,
    "status" "CardStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "DeviationCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" SERIAL NOT NULL,
    "deviationCardId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "responsibleId" INTEGER,
    "responsibleName" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceRequirement" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "year" INTEGER NOT NULL,
    "owner" TEXT,
    "status" "GovernanceStatus" NOT NULL DEFAULT 'PENDING',
    "compliancePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceObservation" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ObservationStatus" NOT NULL DEFAULT 'OPEN',
    "openedYear" INTEGER NOT NULL,
    "openedPeriod" "Period" NOT NULL,
    "closedYear" INTEGER,
    "closedPeriod" "Period",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "GovernanceObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeAsset" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "assetType" TEXT,
    "departmentId" INTEGER,
    "kpiId" INTEGER,
    "status" "AssetStatus" NOT NULL DEFAULT 'DRAFT',
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "year" INTEGER NOT NULL,
    "period" "Period" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" SERIAL NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" INTEGER,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "success" BOOLEAN NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Department_deptNo_key" ON "Department"("deptNo");

-- CreateIndex
CREATE UNIQUE INDEX "Section_code_key" ON "Section"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Section_departmentId_sectionNo_key" ON "Section"("departmentId", "sectionNo");

-- CreateIndex
CREATE UNIQUE INDEX "StrategicGoal_code_key" ON "StrategicGoal"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalGoal_code_key" ON "OperationalGoal"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Kpi_code_key" ON "Kpi"("code");

-- CreateIndex
CREATE INDEX "Kpi_requirementId_idx" ON "Kpi"("requirementId");

-- CreateIndex
CREATE INDEX "Kpi_departmentId_idx" ON "Kpi"("departmentId");

-- CreateIndex
CREATE INDEX "Kpi_ownerId_idx" ON "Kpi"("ownerId");

-- CreateIndex
CREATE INDEX "Kpi_active_type_idx" ON "Kpi"("active", "type");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementRequirement_code_key" ON "MeasurementRequirement"("code");

-- CreateIndex
CREATE INDEX "MeasurementRequirement_ownerId_idx" ON "MeasurementRequirement"("ownerId");

-- CreateIndex
CREATE INDEX "MeasurementRequirement_departmentId_idx" ON "MeasurementRequirement"("departmentId");

-- CreateIndex
CREATE INDEX "MeasurementRequirement_sectionId_idx" ON "MeasurementRequirement"("sectionId");

-- CreateIndex
CREATE INDEX "MeasurementRequirement_fillerRole_idx" ON "MeasurementRequirement"("fillerRole");

-- CreateIndex
CREATE INDEX "MeasurementPeriod_approvalStatus_idx" ON "MeasurementPeriod"("approvalStatus");

-- CreateIndex
CREATE INDEX "MeasurementPeriod_year_period_approvalStatus_idx" ON "MeasurementPeriod"("year", "period", "approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementPeriod_requirementId_year_period_key" ON "MeasurementPeriod"("requirementId", "year", "period");

-- CreateIndex
CREATE UNIQUE INDEX "KpiTarget_kpiId_year_period_key" ON "KpiTarget"("kpiId", "year", "period");

-- CreateIndex
CREATE INDEX "ApprovalEvent_measurementPeriodId_idx" ON "ApprovalEvent"("measurementPeriodId");

-- CreateIndex
CREATE INDEX "KpiEntry_year_period_approvalStatus_idx" ON "KpiEntry"("year", "period", "approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "KpiEntry_kpiId_year_period_key" ON "KpiEntry"("kpiId", "year", "period");

-- CreateIndex
CREATE INDEX "Evidence_measurementPeriodId_idx" ON "Evidence"("measurementPeriodId");

-- CreateIndex
CREATE INDEX "Evidence_kpiEntryId_idx" ON "Evidence"("kpiEntryId");

-- CreateIndex
CREATE INDEX "EarlyWarningAlert_year_period_idx" ON "EarlyWarningAlert"("year", "period");

-- CreateIndex
CREATE UNIQUE INDEX "DeviationCard_kpiId_year_period_key" ON "DeviationCard"("kpiId", "year", "period");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceRequirement_code_key" ON "GovernanceRequirement"("code");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalGoal" ADD CONSTRAINT "OperationalGoal_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalGoal" ADD CONSTRAINT "OperationalGoal_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalGoal" ADD CONSTRAINT "OperationalGoal_strategicGoalId_fkey" FOREIGN KEY ("strategicGoalId") REFERENCES "StrategicGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_strategicGoalId_fkey" FOREIGN KEY ("strategicGoalId") REFERENCES "StrategicGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_operationalGoalId_fkey" FOREIGN KEY ("operationalGoalId") REFERENCES "OperationalGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "MeasurementRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementRequirement" ADD CONSTRAINT "MeasurementRequirement_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementRequirement" ADD CONSTRAINT "MeasurementRequirement_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementRequirement" ADD CONSTRAINT "MeasurementRequirement_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementPeriod" ADD CONSTRAINT "MeasurementPeriod_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "MeasurementRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementPeriod" ADD CONSTRAINT "MeasurementPeriod_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementPeriod" ADD CONSTRAINT "MeasurementPeriod_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementPeriod" ADD CONSTRAINT "MeasurementPeriod_initialApprovedById_fkey" FOREIGN KEY ("initialApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiTarget" ADD CONSTRAINT "KpiTarget_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalEvent" ADD CONSTRAINT "ApprovalEvent_measurementPeriodId_fkey" FOREIGN KEY ("measurementPeriodId") REFERENCES "MeasurementPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalEvent" ADD CONSTRAINT "ApprovalEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiEntry" ADD CONSTRAINT "KpiEntry_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiEntry" ADD CONSTRAINT "KpiEntry_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiEntry" ADD CONSTRAINT "KpiEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_kpiEntryId_fkey" FOREIGN KEY ("kpiEntryId") REFERENCES "KpiEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_measurementPeriodId_fkey" FOREIGN KEY ("measurementPeriodId") REFERENCES "MeasurementPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarlyWarningAlert" ADD CONSTRAINT "EarlyWarningAlert_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviationCard" ADD CONSTRAINT "DeviationCard_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviationCard" ADD CONSTRAINT "DeviationCard_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_deviationCardId_fkey" FOREIGN KEY ("deviationCardId") REFERENCES "DeviationCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAsset" ADD CONSTRAINT "KnowledgeAsset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAsset" ADD CONSTRAINT "KnowledgeAsset_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

