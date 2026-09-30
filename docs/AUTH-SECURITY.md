# Authentication and Security

Register normalizes email, validates password policy, hashes with Argon2id (or bcrypt with documented cost), and creates user-owned default categories. Login uses a generic `INVALID_CREDENTIALS` response and rate limits by IP and account key. Logout invalidates the server session.

Preferred strategy is an opaque server-side session in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie; production uses HTTPS and session expiry/rotation. Cookie-authenticated state-changing requests require CSRF protection. If bearer tokens are chosen instead, use short-lived access tokens, rotation/revocation and secure storage documented before implementation.

Every query and mutation derives user identity from auth context and scopes every referenced ID to that user. Validate and bound all input, use Prisma parameters, avoid password/token logging, configure strict CORS to the frontend origin, and return generic internal errors. Add security tests for cross-user IDs, archived resources, auth failures, CSRF, rate limits and deleted transactions.
