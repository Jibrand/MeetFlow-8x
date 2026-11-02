# MeetFlow AI — API Reference & Architectural Guide

## 1. Overview & Architectural Principles

MeetFlow AI's backend is built on **Node.js, Express.js (Native ES Modules), TypeScript, Prisma ORM, and Neon PostgreSQL**.

All client-facing endpoints are namespaced under the versioned prefix:
```
/api/v1
```
(with root aliases mounted at `/api` for convenience).

### Key Architectural Guidelines
- **Transactional Tenancy**: Registration provisions both the User and an initial Workspace with `OWNER` membership in a single atomic transaction.
- **Stateless Access, Stateful Sessions**:
  - **Access Tokens**: Short-lived (15 minutes), signed via JWT, transported inside `httpOnly`, `SameSite=Lax` cookies (`meetflow_access_token`).
  - **Refresh Tokens**: Opaque 32-byte cryptographically secure random tokens, hashed via SHA-256 before storage in Neon PostgreSQL (`auth_sessions`), rotated on each refresh, and transported via `httpOnly` cookie (`meetflow_refresh_token`).
- **Never Expose Tokens to JavaScript**: No tokens or sensitive user credentials are saved in `localStorage` or `sessionStorage`.
- **Strict Input Validation**: Every endpoint validates incoming payloads against typed Zod schemas.
- **Background Job Execution**: Transcripts are processed asynchronously via BullMQ + Redis workers. Meeting records in Neon act as the durable single source of truth.

---

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
| `POST` | `/api/v1/auth/register` | No | Register new user, workspace, and establish session |
| `POST` | `/api/v1/auth/login` | No | Verify credentials, issue access & refresh cookies |
| `POST` | `/api/v1/auth/refresh` | Cookie | Rotate refresh token and issue fresh access token |
| `POST` | `/api/v1/auth/logout` | Cookie | Revoke persistent session in database and clear cookies |
| `GET` | `/api/v1/auth/me` | Yes | Get active user profile, workspace role, and onboarding state |
| `POST` | `/api/v1/auth/forgot-password` | No | Initiate password reset token (1 hr expiry) |
| `POST` | `/api/v1/auth/reset-password` | No | Reset password using one-time verification token |
| `GET` | `/api/v1/users/me` | Yes | Get profile details for authenticated user |
| `PATCH` | `/api/v1/users/me` | Yes | Update profile name |
| `GET` | `/api/v1/workspaces/current` | Yes | Get active workspace metadata & members count |
| `PATCH` | `/api/v1/workspaces/current` | Yes (Owner/Admin) | Update workspace name and organization details |
| `GET` | `/api/v1/onboarding` | Yes | Fetch persisted onboarding progress |
| `PATCH` | `/api/v1/onboarding` | Yes | Save professional role, use cases, and current step |
| `POST` | `/api/v1/onboarding/workspace` | Yes | Provision or configure workspace during onboarding |
| `POST` | `/api/v1/onboarding/complete` | Yes | Mark onboarding completed |
| `POST` | `/api/v1/meetings` | Yes (Workspace) | Create meeting, optionally attach transcript & enqueue processing |
| `GET` | `/api/v1/meetings` | Yes (Workspace) | List workspace meetings with pagination, status & search filters |
| `GET` | `/api/v1/meetings/overview` | Yes (Workspace) | Overview dashboard analytics and KPI aggregations |
| `GET` | `/api/v1/meetings/:id` | Yes (Workspace) | Fetch comprehensive meeting intelligence, summary & segments |
| `PATCH` | `/api/v1/meetings/:id` | Yes (Workspace) | Update meeting metadata, title, times, or lifecycle status |
| `DELETE` | `/api/v1/meetings/:id` | Yes (Workspace) | Delete meeting and cascading segments/jobs |
| `POST` | `/api/v1/meetings/:id/transcript` | Yes (Workspace) | Upload transcript and trigger asynchronous processing |
| `GET` | `/api/v1/meetings/:id/transcript` | Yes (Workspace) | Get raw transcript and parsed turns |
| `GET` | `/api/v1/meetings/:id/processing` | Yes (Workspace) | Poll live background processing status, stage, and progress (0-100%) |
| `POST` | `/api/v1/meetings/:id/reprocess` | Yes (Workspace) | Re-enqueue transcript processing idempotently |
| `GET` | `/api/v1/action-items` | Yes (Workspace) | List workspace action items with status & search filters |
| `POST` | `/api/v1/action-items` | Yes (Workspace) | Create manual action item |
| `PATCH` | `/api/v1/action-items/:id` | Yes (Workspace) | Update action item status (TODO, IN_PROGRESS, DONE) and metadata |
| `DELETE` | `/api/v1/action-items/:id` | Yes (Workspace) | Delete action item |

---

## 4. OpenAPI 3.1 Specification

### Highlights, public sharing and summary types

| Method | Path (under `/api/v1`) | Contract |
| :--- | :--- | :--- |
| GET / POST | `/meetings/:id/highlights` | Workspace-authorized list/create. Fields: label (required on create, max 255), quote (max 30,000), tag (max 100), nullable nonnegative startTime in seconds. Returns persisted UUIDs and hasTimestamp. |
| PATCH / DELETE | `/meetings/:id/highlights/:highlightId` | Edit supplied fields or soft-delete. Deleted quotes are retained as tombstones so processing retries do not resurrect them. |
| GET | `/meetings/:id/sharing` | Authenticated workspace sharing state and capability token. Never cache/share this management response publicly. |
| POST | `/meetings/:id/sharing` | `{action, permissions?}`; action is enable, disable, regenerate, revoke or update. Permissions are allowSummary, allowHighlights, allowActions, allowTranscript booleans. Transcript defaults off. |
| GET | `/public/meetings/:token` | Anonymous, rate-limited, read-only allowlisted DTO. Requires an enabled, unexpired 256-bit random capability. Invalid/revoked links return 404. No workspace IDs, member emails, private file URLs, recordings or private controls are exposed. |
| GET / POST | `/meetings/:id/summaries/:type` | type: general, executive, engineering, product, sales or interview. GET reads persisted content/status. POST enqueues only missing/stale content; `{retry:true}` explicitly retries a failed generation. |

Sharing is off until explicitly enabled. Disabling denies requests while retaining the link; enabling restores it. Regeneration atomically replaces the old capability; revoke removes it. Anyone holding an enabled link can read permitted content, so recipients can forward it. Public pages use no authentication requests or workspace shell, omit cookies on API reads, hide prior content if access is revoked, and refresh access every 30 seconds. Public responses use no-store/noindex and no-referrer headers. Deployment access logs should redact `/share/:token` and `/public/meetings/:token` capability paths; API diagnostic paths already do so. Tokens must never enter conversation logs or analytics.

Summary variants reuse the existing BullMQ queue/worker and environment-configured OpenAI client. A unique `(meetingId,type)` row plus a generation identifier deduplicates concurrent requests. READY results are reused without an AI call; source-summary revision changes invalidate old variants. Generation uses saved structured meeting facts, not invented template placeholders. Provider work stays outside database transactions; completion is guarded against stale generations/source revisions. Failures are persisted, retry is explicit, and a five-minute stale queued/running state becomes a useful failure instead of an indefinite spinner. The General summary is the existing saved base summary and requires no additional generation.

Apply the additive `20261102100000_meeting_collaboration` migration through `scripts/apply-feature-schema.ts`, then regenerate Prisma. It adds summary-variant storage, share permissions and highlight deletion tombstones, and materializes existing saved AI highlight quotes as editable rows. Unknown timestamps remain null. No database reset is needed. Private highlight changes are optimistic with rollback; public viewers always receive the database state.

### Meeting editing and deletion

`PATCH /meetings/:id` accepts optional `participants` alongside title, description, startAt, endAt, timezone and meetingStatus. Omit participants to retain them; send an array to replace them atomically, or `[]` to clear them. Names are trimmed, limited to 100 characters, and case-insensitively unique; at most 200 participants are accepted. Each participant may include nullable email and role. Create uses the same validation. The dashboard exposes keyboard chips and real edit/delete dialogs; DELETE cascades meeting-owned records and removes its private recording. All operations remain workspace-authorized.

### Intelligence, media and calendar endpoints

| Method | Path (under `/api/v1`) | Behavior |
| :--- | :--- | :--- |
| POST | `/ask` | Authenticated workspace retrieval and live OpenAI answer; optional meetingId and up to ten history messages. Returns actual stored citations and bounded retrieval scope. Twenty requests/user/minute. |
| POST | `/meetings/media` | Authenticated multipart `file` and JSON-encoded `metadata` matching Create Meeting fields. Maximum 512 MiB, five uploads/user/minute; saves privately and queues the existing worker. |
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
