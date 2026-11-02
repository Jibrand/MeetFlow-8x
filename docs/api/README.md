# MeetFlow AI — API Reference & Architectural Guide

Production deployment serves the existing root API at `/api` and versioned API
at `/api/v1` on the frontend's HTTPS origin. Caddy forwards paths unchanged.
`TRUST_PROXY_HOPS=1` trusts the single Caddy hop for secure cookies and client IPs;
direct/local operation defaults to zero. See `DEPLOYMENT.md` for configuration.

## 1. Single-admin execution architecture

MeetFlow has one persisted admin and workspace. Login, initial admin registration, session refresh and Logout are enabled. Registration closes once the admin password is configured; only the instance admin can sign in. Historical identity/workspace rows remain as provenance and do not grant access. No team registration, invitations or role-management features are exposed.

All dashboard routes and meeting-data APIs require an active admin session, including share-link views and API documentation. Share tokens and section permissions are additional restrictions, not an authentication bypass. Only health and authentication entry points are available without sign-in. The server binds to 127.0.0.1 by default (HOST can be configured). Production requires HTTPS, a private JWT signing secret and explicit CORS origins.

Company → Project → Meeting → canonical tasks, decisions and AI actions. Project IDs are explicitly selected and validated; no project association is inferred by AI, titles or people. Prisma foreign keys, project indexes, unique extraction keys and additional composite project foreign keys protect cross-record integrity. Decisions and cross-meeting audit records restrict destructive deletion; task deletion is soft and archive/restore are supported.

Background transcript extraction uses the existing OpenAI/BullMQ pipeline. It now returns structured commitments, decisions, exact evidence and suggested draft actions in the initial extraction. Deterministic title/owner/date matching runs first, only within the selected project. A bounded semantic call is used only for ambiguous candidates and cannot introduce arbitrary IDs. Uncertain matches remain unapplied. All provider work stays outside short database transactions.

## 2. Standardized API Envelopes

### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "50eb1ccb-4feb-4f88-aa8b-e6e5a14f96ea",
    "timestamp": "2026-11-02T02:00:00.000Z",
    "version": "v1"
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check your input.",
    "details": [
      {
        "field": "email",
        "message": "Please enter a valid email address"
      }
    ]
  },
  "meta": {
    "requestId": "50eb1ccb-4feb-4f88-aa8b-e6e5a14f96ea",
    "timestamp": "2026-11-02T02:00:00.000Z",
    "version": "v1"
  }
}
```

---

## 3. Endpoints Catalog

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Operational uptime & database connectivity check |
| `GET` | `/api/v1/auth/me` | Instance | Get active user profile, workspace role, and onboarding state |
| `GET` | `/api/v1/users/me` | Instance | Get profile details for authenticated user |
| `PATCH` | `/api/v1/users/me` | Instance | Update profile name |
| `GET` | `/api/v1/workspaces/current` | Instance | Get active workspace metadata & members count |
| `PATCH` | `/api/v1/workspaces/current` | Instance | Update workspace name and organization details |
| `POST` | `/api/v1/meetings` | Instance | Create meeting, optionally attach transcript & enqueue processing |
| `GET` | `/api/v1/meetings` | Instance | List workspace meetings with pagination, status & search filters |
| `GET` | `/api/v1/meetings/overview` | Instance | Overview dashboard analytics and KPI aggregations |
| `GET` | `/api/v1/meetings/:id` | Instance | Fetch comprehensive meeting intelligence, summary & segments |
| `PATCH` | `/api/v1/meetings/:id` | Instance | Update meeting metadata, title, times, or lifecycle status |
| `DELETE` | `/api/v1/meetings/:id` | Instance | Delete meeting and cascading segments/jobs |
| `POST` | `/api/v1/meetings/:id/transcript` | Instance | Upload transcript and trigger asynchronous processing |
| `GET` | `/api/v1/meetings/:id/transcript` | Instance | Get raw transcript and parsed turns |
| `GET` | `/api/v1/meetings/:id/processing` | Instance | Poll live background processing status, stage, and progress (0-100%) |
| `POST` | `/api/v1/meetings/:id/reprocess` | Instance | Re-enqueue transcript processing idempotently |
| `GET` | `/api/v1/action-items` | Instance | List workspace action items with status & search filters |
| `POST` | `/api/v1/action-items` | Instance | Create manual action item |
| `PATCH` | `/api/v1/action-items/:id` | Instance | Update action item status (TODO, IN_PROGRESS, DONE) and metadata |
| `DELETE` | `/api/v1/action-items/:id` | Instance | Delete action item |

---

## Project/execution API additions

All paths below are under /api/v1 and use the single-admin instance context.

| Method | Path | Behavior |
| :--- | :--- | :--- |
| GET / POST | /companies | List nested projects / create company. |
| PATCH / DELETE | /companies/:id | Update metadata / delete only when empty. |
| POST | /projects | Create with explicit companyId and name. |
| PATCH / DELETE | /projects/:id | Update name/description/status / delete only when unreferenced. Explicit ACTIVE acknowledges review assignment. |
| POST | /meetings/:id/project | Explicit companyId/projectId reassignment. Processing or cross-meeting audit links block unsafe moves. |
| GET | /projects/:id/board | Database-filtered search/owner/priority/archive view, counts and owner choices. Up to 1,000 cards; truncated is explicit. |
| GET | /projects/:id/tasks/:taskId | Task, source evidence, source meeting and latest 100 activity events. |
| POST | /projects/:id/tasks/:taskId/:operation | move, duplicate, archive or restore. Move requires version and accepts status/beforeId/afterId. Anchors are validated within the destination project/status. Ordering is persisted and tightly spaced ranks are rebalanced atomically. |
| GET | /projects/:id/intelligence | Project decisions/conflicts/actions; optional meetingId restricts actions and search filters decisions. Bounded history reads protect request cost. |
| POST | /projects/:id/conflicts/:conflictId/review | decision=confirm or dismiss. Confirm preserves originals, records events, and marks the prior decision superseded. |
| POST | /projects/:id/ai-actions/:actionId/review | Confirm or dismiss a supported commitment proposal. Project and expected task version must match. Confirmation/dismissal and evidence enter the task history. |
| POST | /projects/:id/ai-actions/:actionId/generate | Reuse generatedContent or enqueue deduplicated BullMQ draft generation. retry=true explicitly retries failure. Never sends mail or executes external actions. |
| POST | /meetings/:id/suggestions/refresh | Deterministic alternatives from saved facts; existing/dismissed keys and repeated definitions are excluded. |
| POST | /integrations/calendar/project | Persist the selected project for new Google Calendar imports. No title/participant matching or implicit project assignment. |

Meeting creation (JSON or media metadata) now requires projectId; companyId, when supplied, must own that project. The UI requires both selections and remembers them locally. Meeting lists and overview accept projectId/companyId; Calendar shares that context. Ask requires an explicit project or a meeting whose project is derived server-side. Its source queries never cross projects.

Action Items and Kanban use the SAME action_items rows. Manual creation requires projectId unless derived from an explicit same-project meetingId. Fields include description, owner name, priority LOW/MEDIUM/HIGH, deadline, TODO/IN_PROGRESS/BLOCKED/DONE, evidence, ordering, archive/deletion state and version. PATCH edits supplied fields with a compare-and-swap version; DELETE preserves audit history while hiding the task. Database status counts exclude archived/deleted rows. Mutations invalidate board/detail/action/dashboard caches; optimistic changes are project-aware and roll back on conflict.

Follow-up proposals never silently update an existing task. Exact normalized deliverable/owner matches are preferred; date/identifier information narrows candidates, ambiguous comparisons are bounded to project tasks, and quoted evidence must be grounded in transcript segments. Completion/blocker/deadline/delay changes need confirmation. Repeated mentions link history rather than duplicate tasks. Original decision statements/evidence are retained; conflicts represent possible relationships requiring review, not automatic truth claims.

### Migration and development phase

Run pnpm --filter @meetflow/api exec tsx scripts/apply-project-schema.ts and pnpm --filter @meetflow/api exec prisma generate. The project migration is transactional and was applied to the configured Neon database without a reset. It creates clearly labelled legacy-import companies and ONE review project per historical meeting, plus review buckets for orphan/manual tasks. It never guesses that unrelated old meetings share a real project. Review flags disable cross-meeting matching until explicit assignment. Previously saved decisions are imported as saved-summary evidence, not fabricated transcript quotes. Reassignment is explicit and foreign-key guarded. Use the checked-in migration/runner rather than destructive schema resets; composite isolation constraints are intentionally represented in SQL as well as ordinary Prisma relations.

No unit, integration or E2E tests were written/run and no test datasets were created in this phase. Only migration/client generation, TypeScript and production-build compilation are in scope. Production TypeScript excludes test files; existing account/project fixtures and mock boundaries belong to the separately requested verification phase. Live AI matching, sequential-meeting scenarios, drag/drop and full regression behavior are not claimed verified here.

## 4. OpenAPI 3.1 Specification

### Highlights, public sharing and summary types

| Method | Path (under `/api/v1`) | Contract |
| :--- | :--- | :--- |
| GET / POST | `/meetings/:id/highlights` | Workspace-authorized list/create. Fields: label (required on create, max 255), quote (max 30,000), tag (max 100), nullable nonnegative startTime in seconds. Returns persisted UUIDs and hasTimestamp. |
| PATCH / DELETE | `/meetings/:id/highlights/:highlightId` | Edit supplied fields or soft-delete. Deleted quotes are retained as tombstones so processing retries do not resurrect them. |
| GET | `/meetings/:id/sharing` | Instance/project sharing state and capability token. Never cache/share this management response publicly. |
| POST | `/meetings/:id/sharing` | `{action, permissions?}`; action is enable, disable, regenerate, revoke or update. Permissions are allowSummary, allowHighlights, allowActions, allowTranscript booleans. Transcript defaults off. |
| GET | `/public/meetings/:token` | Anonymous, rate-limited, read-only allowlisted DTO. Requires an enabled, unexpired 256-bit random capability. Invalid/revoked links return 404. No workspace IDs, member emails, private file URLs, recordings or private controls are exposed. |
| GET / POST | `/meetings/:id/summaries/:type` | type: general, executive, engineering, product, sales or interview. GET reads persisted content/status. POST enqueues only missing/stale content; `{retry:true}` explicitly retries a failed generation. |

Sharing is off until explicitly enabled. Disabling denies requests while retaining the link; enabling restores it. Regeneration atomically replaces the old capability; revoke removes it. Shared views now also require the active admin session; a link alone does not grant access. They retain a standalone layout, send HTTP-only session cookies, hide prior content if access is revoked, and refresh access every 30 seconds. Responses use no-store/noindex and no-referrer headers. Deployment access logs should redact `/share/:token` and `/public/meetings/:token` capability paths; API diagnostic paths already do so. Tokens must never enter conversation logs or analytics.

Summary variants reuse the existing BullMQ queue/worker and environment-configured OpenAI client. A unique `(meetingId,type)` row plus a generation identifier deduplicates concurrent requests. READY results are reused without an AI call; source-summary revision changes invalidate old variants. Generation uses saved structured meeting facts, not invented template placeholders. Provider work stays outside database transactions; completion is guarded against stale generations/source revisions. Failures are persisted, retry is explicit, and a five-minute stale queued/running state becomes a useful failure instead of an indefinite spinner. The General summary is the existing saved base summary and requires no additional generation.

Apply the additive `20261102100000_meeting_collaboration` migration through `scripts/apply-feature-schema.ts`, then regenerate Prisma. It adds summary-variant storage, share permissions and highlight deletion tombstones, and materializes existing saved AI highlight quotes as editable rows. Unknown timestamps remain null. No database reset is needed. Private highlight changes are optimistic with rollback; public viewers always receive the database state.

### Meeting editing and deletion

`PATCH /meetings/:id` accepts optional `participants` alongside title, description, startAt, endAt, timezone and meetingStatus. Omit participants to retain them; send an array to replace them atomically, or `[]` to clear them. Names are trimmed, limited to 100 characters, and case-insensitively unique; at most 200 participants are accepted. Each participant may include nullable email and role. Create uses the same validation. The dashboard exposes keyboard chips and real edit/delete dialogs; DELETE cascades meeting-owned records and removes its private recording. All operations remain workspace-authorized.

### Intelligence, media and calendar endpoints

| Method | Path (under `/api/v1`) | Behavior |
| :--- | :--- | :--- |
| POST | `/ask` | Instance/project retrieval and live OpenAI answer; optional meetingId and up to ten history messages. Returns actual stored citations and bounded retrieval scope. Twenty requests/user/minute. |
| POST | `/meetings/media` | Instance multipart `file` and JSON-encoded `metadata` matching Create Meeting fields. Maximum 512 MiB, five uploads/user/minute; saves privately and queues the existing worker. |
| GET | `/meetings/:id/media` | Workspace-authorized private media streaming with range support. |
| GET | `/integrations/calendar` | User/workspace connection status, configuration readiness, last sync, safe errors. Never returns tokens. |
| POST | `/integrations/calendar/authorize` | Empty JSON object; returns Google consent URL and sets signed state/PKCE cookie. |
| GET | `/integrations/calendar/callback` | Validates signed ten-minute state cookie, PKCE and membership, encrypts tokens, redirects to Settings. |
| POST | `/integrations/calendar/sync` | Empty JSON object; runs primary-calendar import with an incremental cursor and concurrency lease. |
| POST | `/integrations/calendar/disconnect` | Empty JSON object; revokes authorization/removes connection while preserving imported meetings. |

The worker normalizes audio/video through FFmpeg into 15-minute mono MP3 chunks, calls OpenAI with `OPENAI_API_KEY` and `OPENAI_TRANSCRIPTION_MODEL` (default `gpt-transcribe`), and then reuses the TXT parsing/intelligence pipeline. Transcription timestamps are chunk boundaries, not word alignment; speaker diarization and a meeting-joining recorder are not implemented. Private media lives in `MEDIA_STORAGE_DIR` (default root `.local-media`, ignored by Git). Separate production API and worker processes require the same persistent media volume and FFmpeg installation/binary. Invalid/no-audio recordings and provider failures become actionable processing errors.

Long transcripts use bounded map/reduce analysis instead of the previous 80,000-character truncation. All chunks contribute decisions, topics and action items; progress updates continue between provider calls. Ask retrieves bounded recent/relevant sources, not an exhaustive semantic search of every historical meeting.

Google setup: configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a 32-byte `CALENDAR_ENCRYPTION_KEY` locally; register `http://localhost:4000/api/v1/integrations/calendar/callback` for development. In production configure the matching redirect/frontend URLs. Connect and consent from Settings. Primary-calendar sync is read-only: initial events span one year before/after today, subsequent imports use incremental tokens, expired tokens trigger a full refresh, and cancellations retain stored notes. An API timer checks eligible connections every minute with a five-minute sync interval. Google consent and live account synchronization remain unverified until an account is connected.

The additive media/calendar schema was applied to the existing Neon database with `pnpm --filter @meetflow/api exec tsx scripts/apply-feature-schema.ts`. The checked-in migration assumes the pre-existing base schema; it is not a fresh-database baseline. Never reset existing data to install these additions.

### Dashboard caching and verification

Meeting lists, detail, action items and statistics use workspace/user-scoped React Query caches (30-second freshness, five-minute retention). Processing alone polls every three seconds. Mutations invalidate dependent data; task toggles update cached rows/statistics immediately, show pending state, roll back only the failed item, and revalidate after concurrent toggles settle. Network errors remain visible even while real cached content is retained. Calendar, Meetings, Detail, Action Items and Overview use shaped skeletons rather than seeded fallbacks.

List/count queries run concurrently, overview duration uses a database aggregate, and Prisma 6 `relationJoins` avoids separate remote reads per included relation. Workspace membership is checked on every request; an accidental second check on all meeting routes was removed. See [verification results](../testing/ui-backend-audit.md) for measured results and their limits.

### Meeting processing outcomes

The Meetings screen requests one server page of nine records rather than downloading the archive. `/meetings` supports `viewStatus` (ready/processing/scheduled/failed/cancelled), `platform` (matching the existing upload/meet display mapping), and `sort` (newest/created by creation time, oldest by start time, longest by duration), with an ID tie-breaker. Search includes participant names and exact topic tags as well as title/description. Calendar/Overview may still explicitly load complete datasets for their existing views. New creates enter the acknowledged cache immediately, reset the Meetings screen to the first unfiltered page, and invalidate dependent queries. Input search is debounced; page loads use skeletons and cancellation.

New-meeting forms omit participants. Processing extracts named speakers/participants and explicitly stated roles/emails, with nullable unknown attributes; it does not invent identities or diarization. Existing manually maintained participants and tasks are preserved. Parsed speaker labels and grounded AI participants are merged case-insensitively during atomic finalization.

Final persistence no longer issues a serial write for every extracted task. A row lock guards finalization, existing task titles are read once, extracted duplicates are removed, and new tasks/participants are inserted in batches. Summary, READY status and COMPLETED/100% job state commit together. Database-only transactions have a 15-second ceiling and bounded fresh-transaction retry for P2028/P2034; provider calls are outside transactions and are not repeated by persistence retries. Terminal READY jobs tolerate redelivery. Administrative error details stay in redacted server diagnostics; server errors/offline screens never display internal addresses or stack traces.

The additive `20261102083000_meeting_page_index` migration creates a concurrent index on `(workspaceId, createdAt, id)` for the default page order. `scripts/apply-feature-schema.ts` applies this index and the earlier media/calendar additions idempotently to an existing schema, outside a wrapping transaction; no database reset is required. It was applied to local Neon during verification. New installations still require the base schema.

- `POST /meetings`, transcript upload, and reprocess save data independently from queue availability. `queueStatus: REDIS_UNAVAILABLE` means the persisted meeting and processing job are `FAILED`; it does not mean the job is waiting for an unimplemented database poller. Creation still returns 201 because the meeting was saved.
- Reprocess reports `processingStatus: FAILED` when Redis dispatch fails. Repeated requests do not reset an active job's progress. Completed/failed retained BullMQ jobs are removed before dispatching a fresh attempt with the same meeting job ID.
- `/processing` reports persisted `attempts`, `stage`, `progress`, `errorCode`, `startedAt`, and `completedAt`. Provider failures retry up to three times with exponential backoff. `READY` and the completed job at 100% are saved together with the intelligence results. No-transcript jobs fail without retrying.
- Failure strings identify Redis connectivity, missing workers, paused queues, exhausted stalled recovery, missing AI configuration, provider authentication/quota/timeouts, and invalid provider output. Provider payloads and credentials are not exposed in these strings.
- The API checks stale jobs every 15 seconds (queued jobs become eligible after 30 seconds); missing workers produce an actionable failure instead of a permanent 5% queue. Interrupted jobs use BullMQ stalled recovery; an active job with no progress for ten minutes becomes FAILED even if its connection remains alive. Database status guards prevent a stale watchdog snapshot from overwriting READY and prevent late processing from reviving a timed-out job.

Development starts a worker inside the API process. Production runs `pnpm --filter @meetflow/api start:worker` separately after building. See [processing operations](../testing/meeting-processing.md).

Overview recent meetings include `actionItemCount`. Dashboard action lists follow the existing pagination metadata to load all pages, and task completion on Overview/Action Items uses `PATCH /action-items/:id` rather than local overrides. All five meeting-related screens use backend data and explicit loading/error/empty states.

The machine-readable specification is located at:
[openapi.yaml](./openapi.yaml)

### Documentation Route
Interactive API documentation is served in development and production at:
```
http://localhost:4000/api/docs
```

---

## 5. Security Directives & Mandatory Agent Rule

> [!IMPORTANT]
> **API Documentation Maintenance Directive**:
> Every future API endpoint addition, signature modification, or schema change must update both `docs/api/openapi.yaml` and `docs/api/README.md` within the same commit.


### Focused intelligence UI and suggestion persistence

Initial BullMQ transcript processing saves 2–3 distinct, evidence-backed AI draft suggestions when the transcript supports them, atomically with the summary and READY status. Missing slots use already-saved task/decision evidence, with no additional OpenAI request. `POST /meetings/{id}/suggestions/refresh` fills only remaining slots up to three; saved and dismissed suggestions count toward that cap. Existing records and generated drafts remain in PostgreSQL across reloads and processing retries. Historical meetings with more suggestions are retained unchanged.

Decision Memory orders its timeline by source meeting date and labels confirmed decisions, proposed plans, cancelled decisions and superseded statements separately. Transcript quotes display the parsed speaker and timestamp only when available. Potential conflicts require review. The Follow-up Tracker UI is retired; commitment matching and review APIs remain available for project execution. Calendar/recording integration status cards are removed from the UI; existing integration APIs remain unchanged. Settings is reached from the admin profile menu. Logout now revokes the PostgreSQL session, clears HTTP-only cookies and private client caches, and redirects to Login.

For local development data cleanup, see [reset instructions](../testing/reset-data.md). No API or schema additions are needed for the reset command.

## Admin authentication and deployment

The existing responsive Login/Register forms are mounted at `/login` and `/register`. Dashboard navigation verifies `/auth/me`; it never trusts a local-storage flag or cached user profile as authentication. Expired access cookies trigger one coordinated refresh using the HTTP-only refresh cookie, including when browser storage has been cleared. Session invalidation clears private query caches and redirects to Login, and other tabs receive the sign-out notification. Logout waits for any in-flight refresh and reports revocation errors so the user can retry.

Authentication endpoints (under `/api/v1/auth`, with `/api/auth` aliases):

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/status` | Public `{ registrationOpen: boolean }`; exposes no admin details. |
| POST | `/register` | `{ name, email, password, workspaceName? }`; initial admin only, returns 201 and sets cookies. Returns 403 `REGISTRATION_CLOSED` after setup. |
| POST | `/login` | `{ email, password }`; only the instance admin, returns 200 and sets cookies, or 401 `INVALID_CREDENTIALS`. |
| GET | `/me` | Active admin session required; returns user/workspace/onboarding metadata without credentials. |
| POST | `/refresh` | Empty body; consumes and rotates the opaque refresh cookie, returns 200 or 401. |
| POST | `/logout` | Empty body; revokes the current session and clears both cookies, including when access has expired. Idempotent without a session. |

All mutations, including uploads and auth requests, require `x-meetflow-request: 1`; browser origins must also be in `CORS_ORIGIN`. The custom header forces a preflight for cross-origin requests and guards against login/logout CSRF. Tokens are accepted only through HTTP-only cookies, never JSON bodies, local storage or bearer headers. Access JWTs are restricted to HS256 and the MeetFlow issuer/audience, expire after `ACCESS_TOKEN_EXPIRES_IN` (default 15 minutes), and reference a PostgreSQL session. Every protected API request verifies that the session is unexpired, unrevoked and belongs to the one instance admin. Logout therefore immediately invalidates an otherwise unexpired access token.

Refresh tokens are cryptographically random and stored only as SHA-256 hashes. Rotation uses an atomic compare-and-swap on the same session record, rejects replay, and retains the original absolute expiry (`REFRESH_TOKEN_EXPIRES_DAYS`, default 7, maximum 30). Web Locks coordinate browser refresh and logout across tabs where supported, with an in-tab shared promise fallback. Passwords use bcrypt cost 12; registration requires 8+ characters with a letter and number, and at most 72 UTF-8 bytes to prevent silent bcrypt truncation. Email addresses are normalized. Login/register attempts are rate limited (20 failed attempts per IP per 15 minutes); refresh is separately limited. These lightweight limiters are per API process; use an edge/shared limiter if deploying multiple replicas.

Initial registration is serialized with a PostgreSQL transaction-level advisory lock. A migration-created `!disabled` placeholder can be initialized in place, preserving the workspace and existing record ownership. Otherwise, existing configured admins cannot be replaced by public registration. Existing passwords and data are not reset by this change; sign in with the current admin credentials. Dormant historical users cannot sign in. Complete initial registration before exposing a new instance publicly.

In production set `NODE_ENV=production`, a private high-entropy `JWT_ACCESS_SECRET` (32+ characters; development/example values are refused), `CORS_ORIGIN` to the exact frontend origin(s), and use HTTPS. Cookies are host-only, HTTP-only, Secure in production and SameSite=Lax by default; cross-site deployments require `COOKIE_SAME_SITE=none` and HTTPS. Prefer serving UI and API on the same site because browser third-party-cookie policies can block cross-site sessions. `JWT_REFRESH_SECRET` is retained for compatibility but opaque refresh tokens do not use it. No schema migration is required: existing users, instance state and auth-session tables are reused. API documentation now requires sign-in. Password recovery delivery is not configured and is not advertised on the sign-in form.

Validation in this phase is limited to TypeScript and production builds; authentication behavior has not been exercised with real credentials or newly created accounts.

### Cross-meeting decision reconciliation

Processing compares evidence-backed statements against the entire project history, including superseded decisions, without filtering by title or extraction status. Semantic comparisons run outside database transactions; validated IDs and source meeting dates determine direction. Explicit replacements and revisions preserve both source statements and record SUPERSEDED/REVISED relationships; current authoritative statements are ACTIVE. Ambiguous relationships remain PENDING and affected authoritative decisions are CONFLICTING until reviewed. CONDITIONAL, PROPOSED, ESTIMATE and SUGGESTION statements cannot automatically supersede an approved decision. Conditional descriptions retain prerequisites and never imply they are satisfied. Equal meeting dates require review. Existing dismissed relationships are preserved. Failures in semantic reconciliation fail/retry processing instead of publishing incomplete intelligence. No database migration or new endpoint is required.

`GET /projects/{id}/intelligence` now also returns `reconciliation: "pending" | "failed" | "unavailable" | null`. Reading legacy CONFIRMED/CANCELLED decision rows schedules a deduplicated BullMQ repair job, compares the saved project history using meeting dates, and updates only decision statuses/relationships. Existing summaries, transcripts and action items remain intact. The UI polls while pending and displays an explicit incomplete-comparison state if the worker/provider is unavailable. Projects flagged for review are not automatically reconciled. An unapproved proposal does not deactivate the approved current decision.
