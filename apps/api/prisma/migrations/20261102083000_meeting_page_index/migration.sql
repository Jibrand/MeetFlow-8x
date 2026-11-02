-- Run outside an explicit transaction so existing meeting writes remain available.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "meetings_workspaceId_createdAt_id_idx"
ON "meetings" ("workspaceId", "createdAt", "id");
