# Meeting processing and backend-only page loading

## Root causes found

- `pnpm dev` launched the API/dashboard but no BullMQ consumer. Development now starts the worker inside the API; production still uses a separate worker process.
- The queue producer and worker shared infinite Redis request retries. Enqueue failures left Neon at QUEUED/5% and referenced a reconciliation runner that did not exist. The producer now has bounded Redis operations and records dispatch failures as FAILED. The API watchdog detects missing workers, missing jobs, paused queues, failed/stalled jobs, inconsistent terminal state, and active jobs with no progress for ten minutes. Stage/finalization/retry guards prevent a late worker from reviving a timed-out meeting.
- Retained completed/failed jobs used the same custom job ID, so reprocessing could be silently deduplicated. Terminal jobs are removed before fresh dispatch. Active jobs keep their progress.
- The worker did not persist attempt counts and did not handle its error event. Retry state is now durable, final failures are actionable, provider requests have a 90-second timeout, and BullMQ owns retries (three attempts, 5/10-second backoff).
- Logger callers used both strings and structured objects, but the logger accepted only objects. Development now emits concise status/error text, removes request/SQL noise, and retains redacted failure diagnostics. Production retains structured logging.
- Calendar initialized from seeded meetings and ignored empty/error responses. Meeting Detail used seed-derived stores and fabricated summary content/citations, and its panel/dialog props did not match their component interfaces. Calendar, Meetings and Detail now load real API data with skeletons, empty/error states, retries, and route-keyed query state. Missing duration/tags/host credentials are not fabricated. Calendar and Meetings load all backend pages. Detail uses persisted summary facts and real transcript citations only.

## Local operations

1. Set `DATABASE_URL`, `REDIS_URL` (local development: `redis://127.0.0.1:6379`), and `OPENAI_API_KEY` in your local ignored `.env`. Set `OPENAI_MODEL` only if needed for your provider access.
2. Start Docker Desktop, then `docker compose up -d redis`. No database reset or migration is needed for this fix.
3. Run `pnpm dev` or `pnpm dev:api`. Both start the development consumer with the API. Do not start a duplicate API on port 4000. A separate `pnpm worker` is optional for testing multiple consumers.
4. Run `pnpm processing:doctor`: expect Redis PONG, one or more workers, and database status counts. Configuration values are never printed.
5. Upload a transcript. Poll `/api/v1/meetings/<id>/processing`: QUEUED → PARSING → ANALYZING → FINALIZING → READY (100%). Fast stages may occur between polls. Failure becomes FAILED with an actionable error string; fix configuration/service availability, then use Retry.
6. `pnpm --filter @meetflow/api exec tsx scripts/processing-smoke.ts` exercises the authenticated API, actual Neon/Redis/worker/provider, persisted results, and reprocessing of a retained completed queue job. It creates a temporary verification meeting under an existing local workspace/user and removes only that meeting after a terminal outcome. On interrupted checks it reports the retained verification ID. It never prints auth tokens or credentials. Running it makes provider requests and requires the API to be running.

Production: build with `pnpm build`; run the API and `pnpm --filter @meetflow/api start:worker` separately, with the same Redis/database/model configuration. The build includes the worker entry point. The API owns reconciliation.

## Automated verification

- API lifecycle tests cover real transcript parsing/persistence paths with mocked provider/database/queue boundaries, successful READY, dispatch timeout/missing Redis, idempotent active dispatch, retained terminal reprocessing, attempts/retries/final failure, empty transcript, missing worker, and watchdog concurrency guards.
- Frontend tests hold network responses pending to verify skeletons without demo content, then resolve real-shaped data; they also cover empty workspaces, error/retry states, 404 versus network failure, route changes, all-page fetching, and summary integrity.
- `pnpm --filter @meetflow/api test`, `pnpm --filter @meetflow/dashboard test`, `pnpm typecheck`, and `pnpm build` are the routine checks. Existing demo fixture tests remain test-only; fixture imports are not used by the three repaired pages.

## Capture and scope

Conversation prompts/final responses continue in `.agent-logs/` under AGENTS.md. Runtime console simplification does not replace or alter conversation capture. Historical logs are preserved.

## Follow-up audit: remaining page wiring completed

Action Items, Overview, sidebar task counts, and command-palette meeting search now use the existing backend clients. Empty workspaces stay empty; loading/error states do not fall back to fixtures. Overview charts use all real meetings/tasks rather than the five-item attention/recent lists. Action lists fetch every backend page. Completion changes on both pages persist through PATCH and invalidate shared task/overview/detail queries. ISO datetime due dates are parsed correctly for overdue comparisons. Authentication and the existing page layouts are preserved.

The existing OpenAI integration is real: the worker reads OPENAI_API_KEY from the environment and calls the provider for validated structured meeting intelligence. No second AI service or queue was introduced.

Earlier live verification reached READY, persisted summaries/segments/TODOs, reprocessed a retained job, and removed the temporary verification records. Redis dispatch failure reached FAILED in approximately 2.7 seconds. Earlier browser checks covered Meetings, Calendar, and READY Meeting Detail. These checks occurred before the user explicitly requested no further testing. The latest Action Items/Overview/sidebar/search changes have not been tested or built, as requested; prior fixture-based tests may need updating for the new backend-only behavior.

Still missing: provider-backed Ask MeetFlow Q&A (the separate Ask route remains a demo, and detail Q&A reads saved facts), audio/video transcription and recording capture, external calendar-provider synchronization, and chunked analysis for transcripts beyond the current 80,000-character model-input cap. The Calendar screen itself displays actual workspace meetings. These are separate features from the implemented TXT intelligence pipeline.
