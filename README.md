# MeetFlow AI — Meeting Intelligence Platform (8x Assignment)

MeetFlow AI is a high-density, AI-native meeting intelligence SaaS inspired by Fathom. It captures meeting recordings, synchronizes transcripts, generates executive summaries, highlights critical moments, and tracks action items.

---

## Workspace Architecture

This repository is organized as a lightweight `pnpm` monorepo:

```text
/
├── .agents/                 # 8x automatic prompt & response capture system
├── .agent-logs/             # Authoritative session transcripts (Git tracked)
├── apps/
│   ├── dashboard/           # Primary product: Vite + React + TypeScript + TanStack Router
│   └── api/                 # Express + TypeScript backend with Neon PostgreSQL Prisma schema
├── packages/
│   ├── ui/                  # Design tokens, Tailwind preset, and Radix UI primitives
│   └── contracts/           # Shared Zod schemas, data contracts, and response envelopes
├── docs/
│   ├── architecture/        # System design and data flow documentation
│   ├── decisions/           # Architecture Decision Records (ADRs)
│   ├── product/             # Scope boundaries, roadmap, and deferred features
│   ├── security/            # Security checklist and compliance policies
│   └── testing/             # Test pyramids and quality assurance strategy
├── AGENTS.md                # Agent workspace instructions & capture rules
├── GEMINI.md                # Gemini-specific directives & capture policies
├── CAPTURE-TEST.md          # Official 8x agent capture verification proof
├── .env.example             # Environment variable template
└── pnpm-workspace.yaml      # Monorepo configuration
```

---

## Quickstart

### Prerequisites
- Node.js >= 20 (v24 recommended)
- pnpm >= 9 (v12 recommended)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Configuration
Copy the template to `.env`:
```bash
cp .env.example .env
```

### 3. Start Development Servers
Run both dashboard and backend concurrently:
```bash
pnpm dev
```

The development API also starts the meeting-processing worker. Configure `REDIS_URL`
and `OPENAI_API_KEY` locally; never commit credentials. For local Redis, start Docker
Desktop and run `docker compose up -d redis` (Redis is bound to loopback only and
persists queue state in a named volume). `pnpm processing:doctor` checks connectivity,
worker presence, and database status counts without printing credentials. See
[processing operations](docs/testing/meeting-processing.md) for verification and recovery.

Or run services individually:
```bash
# Dashboard (runs on http://localhost:5173)
pnpm dev:dashboard

# Backend API (runs on http://localhost:4000)
pnpm dev:api
```

---

## Common Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run all applications in development mode |
| `pnpm build` | Build contracts, UI package, API, and dashboard |
| `pnpm typecheck` | Run TypeScript strict checks across the monorepo |
| `pnpm test` | Run Vitest unit & integration test suites |
| `pnpm lint` | Run code quality and type check linter |

---

## Key URLs

- **Dashboard UI**: [http://localhost:5173](http://localhost:5173)
- **Design System Showcase**: [http://localhost:5173/design](http://localhost:5173/design)
- **API Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- **API Base**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

---

## 8x Agent Capture System

Codex sessions now follow [AGENTS.md](AGENTS.md) and
[the conversation logging workflow](docs/conversation-logging.md). Codex logging is
assistant-maintained; automatic runtime capture has not been verified. Existing
Antigravity logs are preserved. The legacy capture mechanism described below applies
to Antigravity only and does not capture Codex chat messages.

As required by the 8x assignment brief, all agent interactions are automatically logged in `.agent-logs/` matching `YYYY-MM-DD_HH-MM-SS_<session-id>.md`.
The capture system is driven by:
1. Lifecycle hooks configured in `.agents/hooks.json`.
2. Daemonized background watcher `.agents/watcher.js` polling IDE transcripts.
3. Strict instructions in `AGENTS.md` and `GEMINI.md`.
Verification details are documented in `CAPTURE-TEST.md`.


### Clear local development data

Run `pnpm db:reset-data` after following the [local reset instructions](docs/testing/reset-data.md). The command refuses remote databases, requires a development database and explicit confirmation, and requires API/workers to be stopped.


### Admin sign-in

The existing Login/Register pages are available at `/login` and `/register`. Sign in with the configured instance admin; public registration is closed after initial setup. Dashboard and meeting-data routes (including share views) require an active cookie session. Settings and working Logout are in the bottom admin profile menu. See [authentication configuration](docs/api/README.md#admin-authentication-and-deployment) for HTTPS, cookies, CORS, session lifetime and production secrets.
