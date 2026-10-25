# Shashank-only super admin implementation plan

Date: 2026-10-25 IST. Status: design only, not implemented.

## Baseline verified by source inspection
services/identity/app.js implements salted scrypt (N=32768,r=8,p=3), timing-safe verification, random session cookies and SHA-256 token digests. mongo-store.js uses authVersion to invalidate sessions after password reset. No role/status/admin CRUD exists. frontend/src/pages/Dashboard.tsx explicitly marks properties, leads and follow-ups as pending. No live session testing was performed in this task.

## Decisions and data flow
HTTPS login -> rate limit/input validation -> server verifies password using stored salt and scrypt -> create random session, persist token digest -> HttpOnly/Secure/SameSite cookie -> admin request -> validate expiry/authVersion/current active user -> require BOTH stored super_admin role and configured immutable SUPER_ADMIN_USER_ID -> validate action/target and CSRF for writes -> MongoDB operation and durable audit -> sanitized response.
Password hashing verifies identity, not permission. Never authorize by display name Shashank, client role or localStorage. Never return password hashes, reset tokens or session secrets even to super admin. Keep current password hashing; plain SHA-256 is for high-entropy random session tokens, not passwords. Deny by default on every API request. Anonymous/invalid session: 401; authenticated without permission: 403.

## Ordered implementation
1. Add role=user, status=active, updatedAt/deletedAt fields and explicit legacy migration. Preserve authVersion/passwordHash. Add unique partial index allowing only one super_admin. Update Mongo adapter and legacy SQLite test adapter deliberately.
2. Add trusted local bootstrap script for an operator-verified existing account ID. Set server-only SUPER_ADMIN_USER_ID. Fail closed if missing/invalid; refuse conflicting privileged account. No first-user promotion, display-name match or public bootstrap endpoint. Public registration always sets user role. Actual Shashank account is not yet identified. Revoke sessions on promotion; record no credentials.
3. Add shared requireSession/requireSuperAdmin/action checks. Resolve current user role/status from DB every request. Increment authVersion on role/status/password/permission changes. Reject disabled/deleted users at login/session/recovery. Protect designated admin from dashboard deletion, disabling, demotion or identity replacement. Use a separate trusted recovery procedure.
4. Add validation, bounded bodies, Origin and session-bound CSRF checks consistently to POST/PATCH/DELETE. Gateway currently forwards only content-type/cookie/Origin; explicitly forward the CSRF header. Allowlist update fields and never pass request objects into Mongo updates. Ordinary CRUD cannot edit role, passwordHash or authVersion.
5. Add /api/admin/users: GET paginated list, POST ordinary user; /:id GET details, PATCH profile, DELETE soft deletion; /:id/status PATCH; /:id/restore POST; /:id/reset-password POST secure recovery request. Never expose credentials. Define dependent-resource ownership reassignment and block deletion when unresolved.
6. Implement actual properties/leads/follow-ups APIs before claiming full resource management. Apply shared permission checks to every CRUD/export/file/bulk route. Normal users remain restricted by ownership/assignment; Shashank gets explicit cross-user business access.
7. Add audit_events: actorId/action/targetId/time/outcome/requestId and sanitized changed fields. No raw bodies/secrets, no dashboard audit-delete endpoint. Couple writes and durable audit using transactions where supported or a recoverable outbox on standalone Mongo; do not silently ignore audit failures. Database administrator tamper resistance is not guaranteed.
8. Add AdminDashboard.tsx, route guard in App.tsx and admin URL/method/error support in services/api.ts. Extend safe /auth/me response with role/status. After login: authorized Shashank -> /admin, other users -> /dashboard. Frontend guards help navigation; backend protects data. Include pagination/search/create/edit/suspend/restore/soft delete/audit UI, destructive-action confirmation and expired-session handling.
9. Configure and verify real recovery email; existing dev reset links are local-only. Add privileged MFA and recent reauthentication for sensitive actions. Production: HTTPS, private authenticated MongoDB, least-privilege DB credentials, backups/recovery, multi-process rate limiting and trusted proxy-IP policy. MFA/email delivery are not verified working features.
10. Extend auth.test.js and mongo.test.js with authorization cases, run npm test/build/lint, verify browser and direct API access. Update api/openapi.js, README.md, IMPLEMENTATION.md and TASKS.md with delivered functionality. Bootstrap verified account after protections are deployed.

## Acceptance checks
- Anonymous admin -> 401; normal user or another person named Shashank -> 403.
- Cookie/localStorage/body role or ID tampering cannot elevate access.
- Only active designated ID + stored super_admin + valid session can perform admin CRUD.
- Missing config/role, expired/revoked session or inactive account denies access.
- Logout/reset/status/role changes invalidate sessions, including stale-login races.
- Reject CSRF/cross-origin writes, unexpected fields, Mongo operators, duplicates and oversized requests.
- No secrets in API responses or audit logs; block second super admin and self-delete/demotion.
- Enforce resource ownership for normal users and test cross-user admin operations.
- Test soft delete/restore dependencies, pagination bounds and audit failures.
- Test actual email delivery/MFA before claiming either complete.

## Task record
What changed: this design document and project-management index/changelog only. Why: user requested flow and complete implementation steps. Affected future files: services/identity/app.js, mongo-store.js, sqlite-store.js; new authorization/bootstrap/admin files; frontend/src/App.tsx, services/api.ts and new admin page; gateway.js; API spec/tests/documentation. Existing work is reused without new dependencies at planning stage.
Verification: source review only; no application code, account or DB modified; no live session or new-feature tests run. Limitations: admin authorization/CRUD/audit/MFA are pending, business modules are placeholders, actual Shashank ID and real email delivery are unverified. Next milestone: schema and trusted bootstrap, backend guards and direct API authorization tests, then CRUD/dashboard.
References: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html and https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
