# Dependency Upgrade Plan

Current release keeps Prisma 6.19.3, Next 15.5.25, Vitest 2.1.9 and Playwright 1.55.0. Do not use `npm audit fix --force`. Current audit includes Playwright high and Vitest critical advisories, both test-only.

Staging/internal deployment is approved under the documented exceptions. Production remains blocked until the accepted risks are remediated or separately approved.

- Next 16: evaluate PostCSS advisories, then run API/web builds, E2E and accessibility checks.
- Prisma: evaluate the `deepmerge-ts` advisory with the Prisma 6 compatibility matrix; preserve the pinned client/CLI version until validated.
- Vitest 5: evaluate Vite/esbuild advisories and rerun all unit/integration tests.

Upgrade each family in an isolated branch, review lockfile changes, run `npm audit`, and obtain release approval before merging.
