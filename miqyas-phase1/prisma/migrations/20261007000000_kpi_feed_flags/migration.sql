-- أعلام تغذية المسارات — تراكمية دون حذف domain/type
ALTER TABLE "Kpi" ADD COLUMN "feedsStrategic" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Kpi" ADD COLUMN "isGovernanceRequirement" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "MeasurementRequirement" ADD COLUMN "feedsStrategic" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MeasurementRequirement" ADD COLUMN "isGovernanceRequirement" BOOLEAN NOT NULL DEFAULT false;

-- ترحيل من domain/type
UPDATE "Kpi"
SET
  "isGovernanceRequirement" = true,
  "feedsStrategic" = false
WHERE "domain" = 'GOVERNANCE';

UPDATE "Kpi"
SET "feedsStrategic" = false
WHERE "type" = 'OPERATIONAL';

UPDATE "Kpi"
SET "feedsStrategic" = true
WHERE "type" = 'STRATEGIC' AND "domain" <> 'GOVERNANCE';

UPDATE "MeasurementRequirement" mr
SET
  "feedsStrategic" = k."feedsStrategic",
  "isGovernanceRequirement" = k."isGovernanceRequirement"
FROM "Kpi" k
WHERE k."requirementId" = mr."id";

UPDATE "MeasurementRequirement"
SET
  "isGovernanceRequirement" = true,
  "feedsStrategic" = false
WHERE "domain" = 'GOVERNANCE'
  AND "isGovernanceRequirement" = false;

CREATE INDEX "Kpi_feedsStrategic_idx" ON "Kpi"("feedsStrategic");
CREATE INDEX "Kpi_isGovernanceRequirement_idx" ON "Kpi"("isGovernanceRequirement");
CREATE INDEX "MeasurementRequirement_feedsStrategic_idx" ON "MeasurementRequirement"("feedsStrategic");
CREATE INDEX "MeasurementRequirement_isGovernanceRequirement_idx" ON "MeasurementRequirement"("isGovernanceRequirement");
