# MeetFlow AI — Architecture Overview

## 1. System Context & Boundaries

MeetFlow AI is structured into decoupled packages and applications sharing common boundaries:

```
                +----------------------------+
                |    Vite React Dashboard    |
                |     (apps/dashboard)       |
                +--------------+-------------+
                               |
                   TanStack Query / HTTP
                               |
                               v
                +----------------------------+
                |     Express Backend API    |
                |         (apps/api)         |
                +--------------+-------------+
                               |
                       Prisma Client
                               |
                               v
                +----------------------------+
                |      Neon PostgreSQL       |
                |    (Serverless Postgres)   |
                +----------------------------+
```

### Monorepo Packages
1. **`@meetflow/contracts`**:
   - Single source of truth for runtime validation and static types.
   - Houses Zod schemas for API envelopes (`ApiSuccessEnvelope`, `ApiErrorEnvelope`), health response models, and domain models (`Meeting`, `User`, `TranscriptSegment`, `ActionItem`, `Highlight`).
2. **`@meetflow/ui`**:
   - UI design system based on Radix primitives and Tailwind CSS.
   - Provides accessible, high-density primitives (Button, Input, Textarea, Card, Dialog, DropdownMenu, Tabs, Toast, Skeleton, etc.).
   - Standardized for 100% desktop browser zoom with compact navigation (32-36px rows, 12-13px text).
3. **`apps/dashboard`**:
   - Client-side SPA built with Vite, React 18, TanStack Router, TanStack Query, and Tailwind CSS.
   - Supports Light, Dark, and System theme states.
4. **`apps/api`**:
   - Express HTTP server with Helmet security headers, CORS allowlist, request ID tracking, structured logging, and Zod input validation middleware.
   - Prisma ORM configured for Neon PostgreSQL serverless pooling.

---

## 2. Data Flow & Communication

1. **Client Request**:
   - TanStack Query dispatches requests to `/api/v1/*` or `/api/health`.
   - In development, Vite reverse-proxies `/api` to `http://localhost:4000`.
2. **API Ingestion & Middleware Pipeline**:
   - **Helmet**: Injects security headers.
   - **CORS**: Enforces origin allowlists.
   - **Body Limit**: Enforces 1MB JSON body limits.
   - **Request ID**: Generates a UUID or preserves incoming `x-request-id`.
   - **Structured Logger**: Logs inbound requests and outbound response metrics (status, durationMs).
   - **Zod Validator**: Validates body, query, and path params before controllers execute.
3. **Data Access & Storage**:
   - Neon PostgreSQL queried via Prisma with connection pooling.
   - In Phase 01, database access is non-blocking and stubbed to avoid premature migration execution before live credentials are confirmed.
