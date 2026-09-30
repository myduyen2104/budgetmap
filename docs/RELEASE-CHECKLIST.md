# Release Checklist

- Set production `DATABASE_URL`, `AUTH_SESSION_SECRET`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`, `NODE_ENV=production`.
- Run `prisma migrate deploy`; never run seed in production.
- Run tests, typecheck and both workspace builds.
- Confirm HTTPS, Secure cookies, CORS origin and backups.
- Roll back application images, not applied migrations; use forward-compatible migrations.
- Verify `GET /health` and graceful shutdown in deployment.
- Review dependency audit and accepted risks in `SECURITY-AUDIT.md`.
- Playwright smoke and axe scripts use `budgetmap_test`, API `3102`, web `3101`, and wait for `/health`; run `npx playwright install chromium` outside the repository before validation.
- Status: MVP release candidate — approved for staging/internal deployment. Production release remains blocked pending separate approval for the accepted build/dev advisories recorded in `SECURITY-AUDIT.md`.
