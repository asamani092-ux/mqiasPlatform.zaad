ALTER TYPE "Role" ADD VALUE 'AUDIT_COMMITTEE';

CREATE TYPE "CommitteeMeetingStatus" AS ENUM ('SCHEDULED', 'HELD', 'CANCELLED');
CREATE TYPE "CommitteeDecisionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');
CREATE TYPE "ExternalUploadStatus" AS ENUM ('PENDING_REVIEW', 'ACKNOWLEDGED');

CREATE TABLE "CommitteeMeeting" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "agenda" TEXT,
    "status" "CommitteeMeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommitteeMeeting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommitteeMinute" (
    "id" SERIAL NOT NULL,
    "meetingId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommitteeMinute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommitteeDecision" (
    "id" SERIAL NOT NULL,
    "meetingId" INTEGER,
    "title" TEXT NOT NULL,
    "recommendation" TEXT,
    "ownerName" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "CommitteeDecisionStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommitteeDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalAuditUpload" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "ExternalUploadStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "meetingId" INTEGER,
    "reportId" INTEGER,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExternalAuditUpload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommitteeMeeting_scheduledAt_idx" ON "CommitteeMeeting"("scheduledAt");
CREATE INDEX "CommitteeMeeting_status_idx" ON "CommitteeMeeting"("status");
CREATE INDEX "CommitteeMinute_meetingId_idx" ON "CommitteeMinute"("meetingId");
CREATE INDEX "CommitteeDecision_meetingId_idx" ON "CommitteeDecision"("meetingId");
CREATE INDEX "CommitteeDecision_status_idx" ON "CommitteeDecision"("status");
CREATE INDEX "ExternalAuditUpload_meetingId_idx" ON "ExternalAuditUpload"("meetingId");
CREATE INDEX "ExternalAuditUpload_reportId_idx" ON "ExternalAuditUpload"("reportId");
CREATE INDEX "ExternalAuditUpload_status_idx" ON "ExternalAuditUpload"("status");

ALTER TABLE "CommitteeMeeting" ADD CONSTRAINT "CommitteeMeeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommitteeMinute" ADD CONSTRAINT "CommitteeMinute_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "CommitteeMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommitteeMinute" ADD CONSTRAINT "CommitteeMinute_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommitteeDecision" ADD CONSTRAINT "CommitteeDecision_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "CommitteeMeeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommitteeDecision" ADD CONSTRAINT "CommitteeDecision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalAuditUpload" ADD CONSTRAINT "ExternalAuditUpload_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "CommitteeMeeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalAuditUpload" ADD CONSTRAINT "ExternalAuditUpload_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "AuditReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalAuditUpload" ADD CONSTRAINT "ExternalAuditUpload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
