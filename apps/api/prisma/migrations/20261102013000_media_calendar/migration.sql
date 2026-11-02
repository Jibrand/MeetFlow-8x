ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "mediaStorageKey" TEXT;
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "mediaFilename" TEXT;
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "mediaMimeType" TEXT;
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "calendarConnectionId" TEXT;
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "externalEventId" TEXT;
CREATE TABLE IF NOT EXISTS "calendar_connections" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspaceId" TEXT NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "provider" TEXT NOT NULL DEFAULT 'google', "calendarId" TEXT NOT NULL DEFAULT 'primary',
  "encryptedRefreshToken" TEXT NOT NULL, "encryptedAccessToken" TEXT, "expiresAt" TIMESTAMP(3),
  "syncToken" TEXT, "lastSyncedAt" TIMESTAMP(3), "syncError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "calendar_connections_userId_workspaceId_provider_key" UNIQUE ("userId", "workspaceId", "provider")
);
CREATE UNIQUE INDEX IF NOT EXISTS "meetings_calendarConnectionId_externalEventId_key" ON "meetings"("calendarConnectionId", "externalEventId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'meetings_calendarConnectionId_fkey') THEN
    ALTER TABLE "meetings" ADD CONSTRAINT "meetings_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "calendar_connections"("id") ON DELETE SET NULL;
  END IF;
END $$;
