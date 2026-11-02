# MeetFlow AI — API Reference & Architectural Guide

## 1. Overview & Architectural Principles

MeetFlow AI's backend is built on **Node.js, Express.js (Native ES Modules), TypeScript, Prisma ORM, and Neon PostgreSQL**.

All client-facing endpoints are namespaced under the versioned prefix:
```
/api/v1
```
(with root aliases mounted at `/api` for convenience).

### Key Architectural Guidelines
- **Transactional Tenancy**: Registration provisions both the User and an initial Workspace with `OWNER` membership in a single atomic transaction.
- **Stateless Access, Stateful Sessions**:
  - **Access Tokens**: Short-lived (15 minutes), signed via JWT, transported inside `httpOnly`, `SameSite=Lax` cookies (`meetflow_access_token`).
  - **Refresh Tokens**: Opaque 32-byte cryptographically secure random tokens, hashed via SHA-256 before storage in Neon PostgreSQL (`auth_sessions`), rotated on each refresh, and transported via `httpOnly` cookie (`meetflow_refresh_token`).
- **Never Expose Tokens to JavaScript**: No tokens or sensitive user credentials are saved in `localStorage` or `sessionStorage`.
- **Strict Input Validation**: Every endpoint validates incoming payloads against typed Zod schemas.
- **Background Job Execution**: Transcripts are processed asynchronously via BullMQ + Redis workers. Meeting records in Neon act as the durable single source of truth.

---

## 2. Standardized API Envelopes

### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "50eb1ccb-4feb-4f88-aa8b-e6e5a14f96ea",
    "timestamp": "2026-11-02T02:00:00.000Z",
    "version": "v1"
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check your input.",
    "details": [
      {
        "field": "email",
        "message": "Please enter a valid email address"
      }
    ]
  },
  "meta": {
    "requestId": "50eb1ccb-4feb-4f88-aa8b-e6e5a14f96ea",
    "timestamp": "2026-11-02T02:00:00.000Z",
    "version": "v1"
  }
}
```

---

## 3. Endpoints Catalog

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Operational uptime & database connectivity check |
| `POST` | `/api/v1/auth/register` | No | Register new user, workspace, and establish session |
| `POST` | `/api/v1/auth/login` | No | Verify credentials, issue access & refresh cookies |
| `POST` | `/api/v1/auth/refresh` | Cookie | Rotate refresh token and issue fresh access token |
| `POST` | `/api/v1/auth/logout` | Cookie | Revoke persistent session in database and clear cookies |
| `GET` | `/api/v1/auth/me` | Yes | Get active user profile, workspace role, and onboarding state |
| `POST` | `/api/v1/auth/forgot-password` | No | Initiate password reset token (1 hr expiry) |
| `POST` | `/api/v1/auth/reset-password` | No | Reset password using one-time verification token |
| `GET` | `/api/v1/users/me` | Yes | Get profile details for authenticated user |
| `PATCH` | `/api/v1/users/me` | Yes | Update profile name |
| `GET` | `/api/v1/workspaces/current` | Yes | Get active workspace metadata & members count |
| `PATCH` | `/api/v1/workspaces/current` | Yes (Owner/Admin) | Update workspace name and organization details |
| `GET` | `/api/v1/onboarding` | Yes | Fetch persisted onboarding progress |
| `PATCH` | `/api/v1/onboarding` | Yes | Save professional role, use cases, and current step |
| `POST` | `/api/v1/onboarding/workspace` | Yes | Provision or configure workspace during onboarding |
| `POST` | `/api/v1/onboarding/complete` | Yes | Mark onboarding completed |
| `POST` | `/api/v1/meetings` | Yes (Workspace) | Create meeting, optionally attach transcript & enqueue processing |
| `GET` | `/api/v1/meetings` | Yes (Workspace) | List workspace meetings with pagination, status & search filters |
| `GET` | `/api/v1/meetings/overview` | Yes (Workspace) | Overview dashboard analytics and KPI aggregations |
| `GET` | `/api/v1/meetings/:id` | Yes (Workspace) | Fetch comprehensive meeting intelligence, summary & segments |
| `PATCH` | `/api/v1/meetings/:id` | Yes (Workspace) | Update meeting metadata, title, times, or lifecycle status |
| `DELETE` | `/api/v1/meetings/:id` | Yes (Workspace) | Delete meeting and cascading segments/jobs |
| `POST` | `/api/v1/meetings/:id/transcript` | Yes (Workspace) | Upload transcript and trigger asynchronous processing |
| `GET` | `/api/v1/meetings/:id/transcript` | Yes (Workspace) | Get raw transcript and parsed turns |
| `GET` | `/api/v1/meetings/:id/processing` | Yes (Workspace) | Poll live background processing status, stage, and progress (0-100%) |
| `POST` | `/api/v1/meetings/:id/reprocess` | Yes (Workspace) | Re-enqueue transcript processing idempotently |
| `GET` | `/api/v1/action-items` | Yes (Workspace) | List workspace action items with status & search filters |
| `POST` | `/api/v1/action-items` | Yes (Workspace) | Create manual action item |
| `PATCH` | `/api/v1/action-items/:id` | Yes (Workspace) | Update action item status (TODO, IN_PROGRESS, DONE) and metadata |
| `DELETE` | `/api/v1/action-items/:id` | Yes (Workspace) | Delete action item |

---

## 4. OpenAPI 3.1 Specification

The machine-readable specification is located at:
[openapi.yaml](./openapi.yaml)

### Documentation Route
Interactive API documentation is served in development and production at:
```
http://localhost:4000/api/docs
```

---

## 5. Security Directives & Mandatory Agent Rule

> [!IMPORTANT]
> **API Documentation Maintenance Directive**:
> Every future API endpoint addition, signature modification, or schema change must update both `docs/api/openapi.yaml` and `docs/api/README.md` within the same commit.
