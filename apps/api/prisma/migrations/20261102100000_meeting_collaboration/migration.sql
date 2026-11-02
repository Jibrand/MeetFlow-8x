ALTER TABLE "highlights" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "share_links" ADD COLUMN IF NOT EXISTS "allowSummary" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "share_links" ADD COLUMN IF NOT EXISTS "allowHighlights" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "share_links" ADD COLUMN IF NOT EXISTS "allowActions" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "share_links" ADD COLUMN IF NOT EXISTS "allowTranscript" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS "meeting_summary_variants" (
  "id" TEXT PRIMARY KEY, "meetingId" TEXT NOT NULL REFERENCES "meetings"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL, "sourceVersion" TEXT NOT NULL, "generationId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED', "content" JSONB, "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meeting_summary_variants_meetingId_type_key" UNIQUE ("meetingId", "type")
);
CREATE INDEX IF NOT EXISTS "meeting_summary_variants_status_idx" ON "meeting_summary_variants"("status");
-- Preserve existing AI highlights as real editable records; unknown timestamps remain null.
INSERT INTO "highlights" ("id", "meetingId", "quote", "note", "tags", "createdAt")
SELECT gen_random_uuid()::text, s."meetingId", h->>'quote', COALESCE(h->>'label', 'Highlight'), ARRAY[COALESCE(h->>'tag', 'Important')], CURRENT_TIMESTAMP
FROM "meeting_summaries" s CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(s."highlights") = 'array' THEN s."highlights" ELSE '[]'::jsonb END) h
WHERE COALESCE(h->>'quote','') <> '' AND NOT EXISTS (SELECT 1 FROM "highlights" e WHERE e."meetingId"=s."meetingId" AND e."quote"=h->>'quote');
