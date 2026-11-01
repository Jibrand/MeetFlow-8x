# Workspace Agent Guidelines & Logging

## Agent Capture Requirement
- All user prompts and final model responses must be automatically captured in `.agent-logs/` matching the format: `YYYY-MM-DD_HH-MM-SS_<session-id>.md`.
- Capture is wired via `.agents/hooks.json` (`Stop` and `PostToolUse` lifecycle hooks) and backed by the active daemon `.agents/watcher.js` running against the IDE's transcript store at `C:\Users\Jibran\.gemini\antigravity\brain\`.
- Whenever a turn finishes or code changes are committed, ensure logs in `.agent-logs/` are staged and committed alongside code.
- Never overwrite, reset, delete, rewrite, or clean existing agent logs.
- Never add `.agent-logs/` to `.gitignore`. It ships with the repository.

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
