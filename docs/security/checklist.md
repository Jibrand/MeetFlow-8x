# MeetFlow AI — Security & Compliance Checklist

## 1. Secrets & Environment Handling
- [x] Zero committed secrets or API tokens in version control.
- [x] `.env.example` committed with placeholder values.
- [x] `.gitignore` configured to ignore all `.env` variants (`.env`, `.env.local`, `*.env`).
- [x] Server-side runtime validation of environment variables via Zod (`apps/api/src/config.ts`).
- [x] No client-side exposure of private database connection strings or server API keys.

## 2. API & Network Security
- [x] **Helmet**: Enforces HTTP security headers (`X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`, `X-XSS-Protection`).
- [x] **CORS Configuration**: Restricts origin requests strictly to allowed frontends (`http://localhost:5173` and deployed production URLs).
- [x] **Request Limits**: JSON body parser strictly capped at 1MB to prevent memory exhaustion attacks.
- [x] **Request Tracing**: Unique `x-request-id` attached to all incoming and outgoing HTTP transactions.
- [x] **Input Validation**: All payloads, query params, and route parameters validated via Zod schemas in middleware before controller execution.
- [x] **Centralized Error Handling**: Detailed stack traces suppressed in production environments to prevent sensitive internal path leakage.

## 3. Database Safety
- [x] Parameterized SQL execution enforced by Prisma ORM (prevents SQL injection).
- [x] Zero destructive operations (`db push --force-reset` or `migrate reset`) executed without manual confirmation.
- [x] SSL mode enforced for all external database connections (`sslmode=require`).

## 4. 8x Agent Capture Integrity
- [x] Capture daemon and lifecycle hooks run locally without sending secrets or tokens to external endpoints.
- [x] `.agent-logs/` tracked in Git while ensuring sensitive credentials are never stored in session prompts.
