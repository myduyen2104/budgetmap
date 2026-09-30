# MVP Architecture Direction

## Proposed boundary

Next.js web application → NestJS API → Prisma → PostgreSQL.

This remains a design decision only in Phase 0. No runtime is being created now.

## Responsibilities

- Web: presentation, form state, loading/empty/error states.
- API: authentication, authorization, validation and orchestration.
- Domain: financial formulas and status rules.
- Database: persisted inputs, ownership relations, uniqueness and integrity constraints.

Transactions and planning inputs are source of truth. Dashboard/report metrics are derived. No persisted aggregate columns in MVP.

## Security baseline

Password hashing, secure session/token handling, server-derived user identity, ownership checks on every read/write/delete, input validation, generic auth failures, no secret/token logging and rate limiting for login.

## Deliberate non-goals

No microservices, CQRS, event bus, Kubernetes, transfer model, recurring engine, savings-goal engine or external financial integrations.
