BEGIN;
-- AlterEnum
ALTER TYPE "ActionItemStatus" ADD VALUE 'BLOCKED';

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "calendar_connections" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "action_items" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "evidence" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "fingerprint" TEXT,
ADD COLUMN     "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "instance_state" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "instance_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "legacyWorkspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "legacyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "originalStatus" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "fingerprint" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_conflicts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "previousDecisionId" TEXT NOT NULL,
    "newDecisionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "decision_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_events" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_actions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "generatedContent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "sourceKey" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "proposedChanges" JSONB,
    "expectedVersion" INTEGER,
    "targetActionItemId" TEXT,
    "generationId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commitment_history" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actionItemId" TEXT NOT NULL,
    "meetingId" TEXT,
    "eventType" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commitment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_legacyWorkspaceId_key" ON "companies"("legacyWorkspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_legacyKey_key" ON "projects"("legacyKey");

-- CreateIndex
CREATE INDEX "projects_companyId_status_idx" ON "projects"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_companyId_name_key" ON "projects"("companyId", "name");

-- CreateIndex
CREATE INDEX "decisions_projectId_createdAt_idx" ON "decisions"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "decisions_id_projectId_key" ON "decisions"("id", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "decisions_meetingId_fingerprint_key" ON "decisions"("meetingId", "fingerprint");

-- CreateIndex
CREATE INDEX "decision_conflicts_projectId_status_idx" ON "decision_conflicts"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "decision_conflicts_previousDecisionId_newDecisionId_key" ON "decision_conflicts"("previousDecisionId", "newDecisionId");

-- CreateIndex
CREATE INDEX "decision_events_decisionId_createdAt_idx" ON "decision_events"("decisionId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_actions_projectId_status_idx" ON "ai_actions"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_actions_meetingId_sourceKey_key" ON "ai_actions"("meetingId", "sourceKey");

-- CreateIndex
CREATE INDEX "commitment_history_actionItemId_createdAt_idx" ON "commitment_history"("actionItemId", "createdAt");

-- CreateIndex
CREATE INDEX "commitment_history_projectId_meetingId_idx" ON "commitment_history"("projectId", "meetingId");

-- CreateIndex
CREATE INDEX "meetings_projectId_startAt_idx" ON "meetings"("projectId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_id_projectId_key" ON "meetings"("id", "projectId");

-- CreateIndex
CREATE INDEX "action_items_projectId_status_position_idx" ON "action_items"("projectId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "action_items_id_projectId_key" ON "action_items"("id", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "action_items_projectId_fingerprint_key" ON "action_items"("projectId", "fingerprint");


-- Explicit single-admin conversion. Historical identities remain; no login credentials are created.
INSERT INTO "users" (id,email,name,"passwordHash",role,"createdAt","updatedAt") SELECT '00000000-0000-4000-8000-000000000001','instance-admin@meetflow.local','Admin','!disabled','ADMIN',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "users");
INSERT INTO "workspaces" (id,name,slug,"createdAt","updatedAt") SELECT '00000000-0000-4000-8000-000000000002','MeetFlow','meetflow-instance',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "workspaces");
INSERT INTO "instance_state" (id,"userId","workspaceId") SELECT 'primary',(SELECT id FROM "users" ORDER BY "createdAt",id LIMIT 1),(SELECT id FROM "workspaces" ORDER BY "createdAt",id LIMIT 1) ON CONFLICT(id) DO NOTHING;
INSERT INTO "workspace_members" (id,"userId","workspaceId",role,"createdAt") SELECT gen_random_uuid()::text,"userId","workspaceId",'OWNER',CURRENT_TIMESTAMP FROM "instance_state" WHERE id='primary' ON CONFLICT("userId","workspaceId") DO NOTHING;
-- Legacy meetings are isolated one-per-review-project, never guessed into a real project.
INSERT INTO "companies" (id,name,description,"legacyWorkspaceId","createdAt","updatedAt") SELECT gen_random_uuid()::text,'Legacy imports — '||name,'Unassigned historical records. Review company/project assignment before linking meetings.',id,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM "workspaces" w WHERE EXISTS(SELECT 1 FROM "meetings" m WHERE m."workspaceId"=w.id) OR EXISTS(SELECT 1 FROM "action_items" a WHERE a."workspaceId"=w.id) ON CONFLICT("legacyWorkspaceId") DO NOTHING;
INSERT INTO "projects" (id,"companyId",name,description,status,"needsReview","legacyKey","createdAt","updatedAt") SELECT gen_random_uuid()::text,c.id,'Review: '||m.title||' ['||LEFT(m.id,8)||']','Imported meeting with unknown project. No cross-meeting matching until explicitly reassigned.','NEEDS_REVIEW',true,'meeting:'||m.id,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM "meetings" m JOIN "companies" c ON c."legacyWorkspaceId"=m."workspaceId" WHERE m."projectId" IS NULL ON CONFLICT("legacyKey") DO NOTHING;
UPDATE "meetings" m SET "projectId"=p.id FROM "projects" p WHERE p."legacyKey"='meeting:'||m.id AND m."projectId" IS NULL;
UPDATE "action_items" a SET "projectId"=m."projectId" FROM "meetings" m WHERE a."meetingId"=m.id AND a."projectId" IS NULL;
INSERT INTO "projects" (id,"companyId",name,description,status,"needsReview","legacyKey","createdAt","updatedAt") SELECT gen_random_uuid()::text,c.id,'Unassigned manual tasks','Review these historical tasks before assigning a project.','NEEDS_REVIEW',true,'manual:'||c."legacyWorkspaceId",CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM "companies" c WHERE EXISTS(SELECT 1 FROM "action_items" a WHERE a."workspaceId"=c."legacyWorkspaceId" AND a."projectId" IS NULL) ON CONFLICT("legacyKey") DO NOTHING;
UPDATE "action_items" a SET "projectId"=p.id FROM "projects" p WHERE p."legacyKey"='manual:'||a."workspaceId" AND a."projectId" IS NULL;
UPDATE "meetings" SET "workspaceId"=(SELECT "workspaceId" FROM "instance_state" WHERE id='primary');
UPDATE "action_items" SET "workspaceId"=(SELECT "workspaceId" FROM "instance_state" WHERE id='primary');
UPDATE "action_items" SET status='TODO' WHERE status='OPEN'; UPDATE "action_items" SET status='DONE' WHERE status='COMPLETED'; UPDATE "action_items" SET "archivedAt"=CURRENT_TIMESTAMP,status='TODO' WHERE status='DISMISSED';
ALTER TABLE "meetings" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "action_items" ALTER COLUMN "projectId" SET NOT NULL;
-- Materialize previously saved decisions without pretending they are transcript quotes.
INSERT INTO "decisions"(id,"projectId","meetingId",title,description,status,"originalStatus",fingerprint,evidence,"createdAt","updatedAt")
SELECT gen_random_uuid()::text,m."projectId",m.id,LEFT(d.value,255),d.value,'CONFIRMED','CONFIRMED',md5(lower(trim(d.value))),jsonb_build_array(jsonb_build_object('meetingId',m.id,'kind','saved-summary','quote',d.value,'generatedAt',s."generatedAt")),s."generatedAt",s."generatedAt"
FROM "meeting_summaries" s JOIN "meetings" m ON m.id=s."meetingId" CROSS JOIN LATERAL jsonb_array_elements_text(CASE WHEN jsonb_typeof(s.decisions)='array' THEN s.decisions ELSE '[]'::jsonb END) d(value)
WHERE trim(d.value)<>'' ON CONFLICT("meetingId",fingerprint) DO NOTHING;
-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_conflicts" ADD CONSTRAINT "decision_conflicts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_conflicts" ADD CONSTRAINT "decision_conflicts_previousDecisionId_fkey" FOREIGN KEY ("previousDecisionId") REFERENCES "decisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_conflicts" ADD CONSTRAINT "decision_conflicts_newDecisionId_fkey" FOREIGN KEY ("newDecisionId") REFERENCES "decisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_events" ADD CONSTRAINT "decision_events_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_targetActionItemId_fkey" FOREIGN KEY ("targetActionItemId") REFERENCES "action_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitment_history" ADD CONSTRAINT "commitment_history_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitment_history" ADD CONSTRAINT "commitment_history_actionItemId_fkey" FOREIGN KEY ("actionItemId") REFERENCES "action_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitment_history" ADD CONSTRAINT "commitment_history_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Composite foreign keys enforce project isolation even outside application code.
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_meeting_project_fkey" FOREIGN KEY("meetingId","projectId") REFERENCES "meetings"(id,"projectId") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_meeting_project_fkey" FOREIGN KEY("meetingId","projectId") REFERENCES "meetings"(id,"projectId") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_meeting_project_fkey" FOREIGN KEY("meetingId","projectId") REFERENCES "meetings"(id,"projectId") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_task_project_fkey" FOREIGN KEY("targetActionItemId","projectId") REFERENCES "action_items"(id,"projectId") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "commitment_history" ADD CONSTRAINT "commitment_history_task_project_fkey" FOREIGN KEY("actionItemId","projectId") REFERENCES "action_items"(id,"projectId") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "commitment_history" ADD CONSTRAINT "commitment_history_meeting_project_fkey" FOREIGN KEY("meetingId","projectId") REFERENCES "meetings"(id,"projectId") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "decision_conflicts" ADD CONSTRAINT "conflicts_previous_project_fkey" FOREIGN KEY("previousDecisionId","projectId") REFERENCES "decisions"(id,"projectId") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "decision_conflicts" ADD CONSTRAINT "conflicts_new_project_fkey" FOREIGN KEY("newDecisionId","projectId") REFERENCES "decisions"(id,"projectId") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "instance_state" ADD CONSTRAINT "instance_user_fkey" FOREIGN KEY("userId") REFERENCES "users"(id);
ALTER TABLE "instance_state" ADD CONSTRAINT "instance_workspace_fkey" FOREIGN KEY("workspaceId") REFERENCES "workspaces"(id);
COMMIT;
