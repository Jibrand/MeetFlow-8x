# Workspace Agent Guidelines & Logging

## Codex Conversation Logging Requirement
- Codex is the current coding assistant; GitHub Copilot capture is out of scope.
- At each turn, append the user's exact prompt and the exact final response to a session Markdown or JSONL file under `.agent-logs/`, named `YYYY-MM-DD_HH-MM-SS_<session-id>.md` (or `.jsonl`). Prepare the final response, record it, then send that same text.
- Record source, session identifier, and timestamps with timezone. If native session identifiers or message timestamps are unavailable, label a generated logging-session identifier and the capture time explicitly; never invent message times.
- This is assistant-maintained logging, not verified automatic runtime capture. The legacy `.agents/hooks.json`, `capture.js`, and `watcher.js` target Antigravity and do not establish Codex capture. Git hooks cannot capture chat messages.
- Preserve all historical logs. Append only; never overwrite, reset, delete, rewrite, clean, or ignore `.agent-logs/`.
- Record capture gaps explicitly, including interrupted turns, unavailable earlier conversations, compaction, truncation, and missing attachments or tool output. Never reconstruct missing dialogue or label a summary as a verbatim transcript.
- Before committing, review new log content for secrets and credentials. Replace sensitive values with an explicit `[REDACTED: reason]` marker before writing; do not record `.env` contents. Preserve prior files and report any historical secret exposure without echoing it.
- Commit reviewed new log entries incrementally alongside the code they produced. Stage explicit paths only; do not sweep unrelated work into commits. Push to GitHub when authorized and available; report permission, authentication, or network blockers honestly.
- If capture cannot run, retain an exact manual copy of each prompt and final response from the visible chat in a new session file, with capture time and known gaps. Prefer a supported export if offered by the installed client, verify its completeness, and never scrape private app databases or assume an export feature exists.
- See `docs/conversation-logging.md` for the current capture status and manual workflow.

---

## Engineering & Security Directives

### Security
- Never expose, log, or commit real secrets, private keys, or `.env` files.
- Validate all incoming API requests using Zod schemas.
- Enforce explicit CORS allowlists and security headers via Helmet.
- Use Prisma ORM for safe, parameterized database queries.
- Never run destructive database resets (`db push --force-reset` or `migrate reset`) without explicit approval.

### Code Quality & Standards
- TypeScript strict mode enabled across all packages. Avoid unnecessary `any`.
- Keep components cohesive, accessible, and high-density (Linear/Apple inspired, 100% zoom level standard).
- Handle asynchronous errors explicitly with typed error envelopes.
- Keep the repository clean: commit logs interleaved with the code they produced.

### API Documentation Directive
- Every future API addition, signature modification, or schema change must update both `docs/api/openapi.yaml` and `docs/api/README.md` within the same commit.

