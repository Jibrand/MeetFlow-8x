# ADR 001: Architecture, Technology Stack & Monorepo Structure

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** Jibran (Product Engineer)

## Context

The 8x assignment brief requires building **MeetFlow AI**, a premium meeting intelligence SaaS inspired by Fathom. The assignment prioritizes:
1. Speed to a working, deployed product.
2. Product judgment and sensible scope decisions.
3. Excellent UX and UI.
4. Functional meeting intelligence with realistic seeded data.
5. Transparent AI agent usage and complete capture logs.

We need a stack that provides rapid velocity, rigorous type safety across client and server, first-class UI density, and minimal maintenance overhead.

## Decisions

### 1. Monorepo via pnpm Workspaces
- **Decision:** Use `pnpm` workspaces for multi-package code sharing (`@meetflow/contracts`, `@meetflow/ui`, `@meetflow/api`, `@meetflow/dashboard`).
- **Rationale:** Avoids publishing packages to npm while sharing Zod contracts and UI components directly. `pnpm` offers fast, space-efficient dependency linking.
- **Capture Hook Compatibility:** The root `package.json` intentionally omits `"type": "module"` so existing CommonJS capture scripts (`.agents/capture.js`) run smoothly under Node 24.

### 2. Primary Product Dashboard: Vite + React + TanStack Router
- **Decision:** Build the primary product as a Vite React SPA with TanStack Router, rather than an SSR framework like Next.js for the core app.
- **Rationale:** The assignment specifically highlights that the dashboard is the primary product and deployment priority. A polished, snappy SPA with instant client-side routing is ideal for complex interactive playback, transcript scrubbing, and template switching. Marketing sites are secondary and deferred.

### 3. State Management: TanStack Query + Lightweight Local State
- **Decision:** Use TanStack Query for server state caching, pagination, and invalidation. Avoid large Redux stores; rely on local React state and small Zustand stores only where justified.
- **Rationale:** Meeting detail workspaces involve synchronized media playback, summary notes, and action items that are mostly server state with local scrubbing offsets.

### 4. Design System & UI Density: Tailwind CSS + Radix UI
- **Decision:** Use Radix primitives styled with Tailwind CSS, following shadcn/ui conventions.
- **Rationale:** Provides unstyled, accessible keyboard navigation, focus management, and ARIA attributes out of the box, with full freedom to customize density. We explicitly calibrate to 100% desktop zoom with compact controls (32px button heights, 12-13px typography), avoiding generic oversized templates.

### 5. Backend: Express + Neon PostgreSQL + Prisma
- **Decision:** Build a lightweight Express API with Prisma ORM connecting to Neon serverless PostgreSQL.
- **Rationale:** Express provides clear, explicit middleware pipelines without hidden magic. Prisma generates typesafe clients matching our database schema. Neon serverless PostgreSQL provides branching and instant connection pooling.

### 6. Verification and Testing
- **Decision:** Standardize on Vitest across both frontend and backend, with Supertest for API integration testing and React Testing Library for UI components. Playwright configuration is established for future end-to-end flows.

## Consequences
- Fast local development cycle with instant HMR and quick tests.
- Shared Zod validation prevents schema drift between client and API.
- Zero mock dependencies; clear paths to production deployment.
