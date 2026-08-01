-- فهارس الأداء (IF NOT EXISTS: القواعد الجديدة أنشأتها عبر baseline)
CREATE INDEX IF NOT EXISTS "Kpi_departmentId_idx" ON "Kpi"("departmentId");
CREATE INDEX IF NOT EXISTS "Kpi_ownerId_idx" ON "Kpi"("ownerId");
CREATE INDEX IF NOT EXISTS "Kpi_active_type_idx" ON "Kpi"("active", "type");
CREATE INDEX IF NOT EXISTS "MeasurementPeriod_year_period_approvalStatus_idx" ON "MeasurementPeriod"("year", "period", "approvalStatus");
CREATE INDEX IF NOT EXISTS "KpiEntry_year_period_approvalStatus_idx" ON "KpiEntry"("year", "period", "approvalStatus");
