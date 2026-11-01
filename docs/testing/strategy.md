# MeetFlow AI — Testing Strategy & Quality Assurance

## 1. Testing Philosophy
The testing approach balances high velocity with production resilience:
- Target critical paths: API health, input validation, core rendering, state boundaries, and data contract serialization.
- Minimize heavy, brittle end-to-end setups during early phases while ensuring fast unit and integration tests run in milliseconds.

---

## 2. Test Pyramid & Tooling

```
               / \
              /   \
             / E2E \       Playwright (Critical user journeys)
            /-------\
           /  Integ  \     Supertest + Express API endpoints
          /-----------\
         /    Unit     \   Vitest + React Testing Library + Zod
        /---------------\
```

### Component & Frontend Unit Testing
- **Framework:** Vitest + React Testing Library + JSDOM.
- **Scope:** Component render behavior, interactive states, error boundaries, accessible roles, and theme switching.
- **Example:** `Button` component rendering variants (`packages/ui/src/components/button.test.tsx`), `ErrorBoundary` crash fallback recovery (`apps/dashboard/src/components/error-boundary.test.tsx`).

### Backend Integration Testing
- **Framework:** Vitest + Supertest.
- **Scope:** HTTP route handlers, status code accuracy, Zod middleware validation errors, request ID tracking, security header verification.
- **Example:** Health endpoint verification (`apps/api/src/routes/health.test.ts`).

### Static Analysis & Type Checking
- **TypeScript:** Strict type checking across monorepo packages (`pnpm typecheck`).
- **ESLint / Prettier:** Consistent code formatting and syntax cleanliness.

### End-to-End (E2E) Browser Testing
- **Framework:** Playwright (`apps/dashboard/playwright.config.ts`).
- **Scope:** Deferred until complete meeting playback and search screens are assembled in Phases 02 and 03. Heavy browser binaries are avoided in Phase 01 to preserve setup speed.

---

## 3. Execution Commands
```bash
# Run all tests across the monorepo
pnpm test

# Run type check across all workspaces
pnpm typecheck

# Run backend API tests only
pnpm --filter @meetflow/api test

# Run UI package tests only
pnpm --filter @meetflow/ui test

# Run dashboard tests only
pnpm --filter @meetflow/dashboard test
```
