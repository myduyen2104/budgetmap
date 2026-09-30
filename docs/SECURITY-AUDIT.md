# Security Audit

Release status: MVP release candidate — approved for staging/internal deployment. This is not production release approval; accepted dependency risks and mitigations below remain active.

Current implementation uses Argon2id passwords, opaque hashed sessions, HttpOnly/SameSite cookies, production Secure cookies, expiry/revocation, DTO whitelist/forbidNonWhitelisted validation, ownership-scoped Prisma queries, strict CORS origin, Origin checks for production state-changing cookie requests and security response headers. Login failures are generic and rate-limited in memory. Secrets and database URLs are not logged or committed. For multiple API instances, use a shared rate-limit store.

## Dependency audit (2026-09-05)

High PostCSS advisories are only in Next's build pipeline and are not runtime request processing. High `deepmerge-ts` is only through Prisma CLI configuration. Playwright is E2E-only and Vitest/Vite/esbuild are test/build-only. Available fixes require major upgrades (Next 16, Prisma change, Vitest 5), so no incompatible upgrade was applied. These accepted risks are not production runtime execution paths and must be reviewed during the next planned major upgrade. Playwright browser downloads are performed only from the pinned toolchain in CI/local setup.

| Advisory / path | Severity | Runtime | Mitigation |
|---|---:|---|---|
| GHSA-ggr8-5vv4-36mx / Prisma -> deepmerge-ts | High | No | Pin Prisma 6.19.3; planned Prisma upgrade. |
| GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 / Next -> PostCSS | High | No, build-only | Do not process untrusted source maps; planned Next upgrade. |
| GHSA-67mh-4wv8-2f99 / tsx and Vitest -> Vite -> esbuild | Moderate | No | Dev-only; planned toolchain upgrade. |
| GHSA-7mvr-c777-76hp / `@playwright/test -> playwright` | High | No | E2E-only; pin Playwright and review patch upgrade separately. |
| GHSA-5xrq-8626-4rwp / `vitest -> vite` | Critical | No | Test-only; do not expose Vitest UI/server; planned Vitest 5 upgrade. |
