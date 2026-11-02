# Background Meeting Intelligence & Queue Processing Architecture

## 1. High-Level Flow

MeetFlow AI processes meeting transcripts asynchronously using **BullMQ**, **Redis**, and a dedicated worker process, with **Neon PostgreSQL** serving as the durable source of truth.

```mermaid
sequenceDiagram
    participant User as Frontend Client
    participant API as Express API Server
    participant DB as Neon PostgreSQL
    participant Redis as Redis (BullMQ Queue)
    participant Worker as Background Worker
    participant OpenAI as OpenAI Engine (gpt-4o-mini)

    User->>API: POST /api/v1/meetings (with transcript file)
    API->>DB: Save Meeting (QUEUED) & MeetingTranscript
    API->>DB: Record MeetingProcessingJob (jobId)
    API->>Redis: Enqueue job (jobId: meeting-process-{id})
    API-->>User: 201 Created (immediate response)

    loop Polling every 2-3s
        User->>API: GET /api/v1/meetings/{id}/processing
        API-->>User: Stage & progress percentage
    end

    Redis->>Worker: Dispatch job
    Worker->>DB: Set stage = PARSING (15-30%)
    Worker->>Worker: Parse transcript (.txt, .srt, .vtt)
    Worker->>DB: Save TranscriptSegments
    Worker->>DB: Set stage = ANALYZING (45-75%)
    Worker->>OpenAI: Structured extraction request
    OpenAI-->>Worker: JSON (Summary, Key Points, Decisions, Action Items)
    Worker->>DB: Set stage = FINALIZING (85-95%)
    Worker->>DB: Transactionally save MeetingSummary & ActionItems
    Worker->>DB: Update Meeting -> READY, Job -> COMPLETED (100%)
    User->>API: GET /api/v1/meetings/{id}
    API-->>User: Complete meeting intelligence & real turns
```

---

## 2. Queue Reliability & Idempotency Principles

1. **Decoupled Enqueue Strategy**:
   The meeting and raw transcript text are durably committed to Neon before queueing. If Redis is temporarily unreachable, the meeting remains in Neon marked as `QUEUED` and can be retried or reconciled without losing user uploads.

2. **Deduplication & Concurrency**:
   - Jobs use a deterministic `jobId: meeting-process-${meetingId}`.
   - Concurrency is throttled to prevent rate-limit flooding against OpenAI.
   - Exponential backoff retries transient network or rate-limit errors up to 3 times.

3. **Reprocessing & Preserving User State**:
   - Re-running analysis overwrites or refreshes the AI summary and transcript segments cleanly.
   - For action items: tasks that the user has already touched or marked `DONE`/`IN_PROGRESS` are strictly preserved and never overwritten.
   - Retrying does not generate duplicate tasks.

---

## 3. Worker Execution & Development Setup

To run the background worker alongside the Express API and Dashboard:
```bash
# Terminal 1: Express API Server
pnpm dev:api

# Terminal 2: Vite Dashboard
pnpm dev:dashboard

# Terminal 3: BullMQ Worker
pnpm dev:worker
```
