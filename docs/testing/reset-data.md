# Reset local MeetFlow data

`pnpm db:reset-data` is a destructive, reusable development-only command. It preserves tables, migrations, `.env`, admin/workspace identity, and configuration. No migration reset or table deletion is used.

1. Stop MeetFlow API and every standalone worker, including watch processes. Keep them stopped until the command finishes. The script refuses a listening API port, registered BullMQ workers, or active jobs.
2. Configure `NODE_ENV=development`, a PostgreSQL URL pointing directly at `localhost`, `127.0.0.1`, or `[::1]`, and a database name identifying both MeetFlow and development (for example `meetflow_dev`). If `DIRECT_URL` is configured, it must identify the same local database. Use a dedicated local Redis instance. Remote URLs and unsupported connection options are refused. Do not use port forwarding or tunnels to remote/shared services.
3. Run `pnpm db:reset-data` and type the displayed `DELETE <database-name>` phrase. For explicitly confirmed automation, use `pnpm db:reset-data --confirm="DELETE meetflow_dev"`.
4. Restart API/workers and reload the dashboard. Create a company and project to begin fresh testing.

The command verifies PostgreSQL's database identity and loopback server address before any deletion. It pauses the meeting-processing queue, refuses running workers, and clears only that BullMQ namespace (including queued/delayed/retry/completed/failed jobs). It never flushes Redis. This application currently has no other Redis cache namespace. The previous pause state is restored on success; a partial failure leaves the queue paused for recovery.

Application rows are deleted in foreign-key order in one Prisma transaction: conflicts/events/history, AI actions and drafts, decisions/tasks, summary variants/highlights/share links/jobs/summaries/transcript segments/transcripts/participants, meetings, projects and companies. Calendar connection settings/credentials are retained but detached from deleted projects, with sync state cleared; the calendar timer skips unassigned connections, preventing old calendar events from recreating meetings.

The command prints per-model counts and a concise error summary. It can be rerun after a partial failure; deletions of empty data sets are harmless. Queue deletion and the database transaction cannot be atomic across both stores. If the database transaction fails after queue cleanup, records roll back but queued work is lost; keep services stopped and rerun the reset. Uploaded local media files are retained; database references and generated application content are cleared.

On 2026-11-02 the configured PostgreSQL target was remote. The command was invoked and safely refused before connecting or deleting records; no local reset was performed.
