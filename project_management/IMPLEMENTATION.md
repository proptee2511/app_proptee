> Update: runtime storage is now local MongoDB, database cashflow_proptee. See MONGODB.md for current storage, single-document reset atomicity and session-version invalidation. SQLite descriptions below record the original implementation; its adapter remains for regression tests only.

# Automated implementation — 2026-10-20

## Authorization and scope

Earlier work was manual instruction. User subsequently authorized automating all work. Implemented scope is authentication frontend plus local identity backend, gateway, session-protected starter workspace, launcher and regression tests. User additionally requested full-screen login without unnecessary scrolling and an explanation of reset security. Property/lead business modules were not specified and remain explicitly marked as future work.

## Architecture and decisions

Browser → gateway (3001) → identity service (4101) → identity-owned SQLite file.

- Existing React 19 + TypeScript + Vite frontend and React Router were reused. No additional UI packages were required. Tailwind/shadcn/Zod/React Hook Form/TanStack Query were discussed as possible choices but are NOT installed or claimed as implemented.
- FastAPI/PostgreSQL were previously recommended for the longer-term architecture. Installed Node and built-in SQLite were used to deliver a runnable local slice without an unavailable Python runtime or database server. This is an explicit implementation deviation, not a claim that FastAPI/PostgreSQL have been deployed.
- Identity runs as an independent process; gateway serves the built frontend and forwards /api requests. This is the first service boundary. It is not yet a complete multi-service property platform. Gateway is Node locally, not Nginx.
- Old public/ and server.js remain as legacy reference. New npm start and start-crm.cmd run scripts/start.js. Do not use node server.js for the new React app.

## File responsibilities

| File | Responsibility and reason |
| --- | --- |
| frontend/src/components/AuthLayout.tsx | Shared lavender branding and property illustration, consistent across auth screens. |
| frontend/src/components/AuthForm.tsx | Shared typed form with page-specific fields, busy state, error handling, matching-password validation and API calls. Prevents four duplicated implementations. |
| frontend/src/pages/Login.tsx, Register.tsx, ForgotPassword.tsx, ResetPassword.tsx | Small route-specific wrappers selecting the correct form behavior. |
| frontend/src/pages/Dashboard.tsx | Loads server-verified account details; redirects unauthenticated users; logout. Business modules labeled pending. |
| frontend/src/services/api.ts | Same-origin typed requests with cookie credentials, JSON parsing, timeout and error handling. |
| frontend/src/utils/validation.ts | Existing shared frontend password policy retained. Server repeats validation independently. |
| frontend/src/App.tsx | React Router page routes including /dashboard. |
| frontend/src/index.css | #C6A5FF theme, focus styles, responsive form/illustration and full viewport adjustments. |
| frontend/src/main.tsx | Removed duplicate CSS import. |
| frontend/index.html | App title and no-referrer policy; no default Vite favicon in current UI. |
| frontend/vite.config.ts | Explicit dev host/port; /api proxy to 3001. |
| services/identity/app.js | HTTP API, input validation, SQLite schema, password hashes, sessions, reset tokens and throttling. Factory enables isolated tests. |
| services/identity/start.js | Persistent database startup, environment configuration and optional server-only mail adapter. |
| services/identity/auth.test.js | Real HTTP tests using ephemeral servers and isolated databases; no test accounts inserted into app database. |
| gateway.js | Built frontend serving with SPA fallback, security headers and identity forwarding, including Set-Cookie. |
| scripts/start.js | Starts and stops both processes together; propagates service startup failures. |
| start-crm.cmd | Rebuilds frontend, reports errors visibly and starts both services. Does not enable insecure demo recovery by default. |
| package.json | Root build/start/test/lint scripts and Node version requirement. |
| .gitignore | Excludes local DB, secrets, dependencies, builds and logs. |
| README.md | Current executable setup instructions. |

## API contracts

All writes use POST and application/json. API responses are JSON and no-store. Unknown routes return an error.

| Endpoint | Request | Result |
| --- | --- | --- |
| GET /api/auth/health | None | Service readiness status. |
| POST /api/auth/register | name, phone, email, password, confirmPassword | Validated account saved; 201. Case-normalized duplicate email: 409. |
| POST /api/auth/login | email, password | Verifies password; issues HttpOnly session cookie. Invalid credentials: 401. |
| GET /api/auth/me | Session cookie | Server-authorized public account details, or 401. Never returns password hash. |
| POST /api/auth/logout | Empty JSON object, session cookie | Deletes session and expires browser cookie. |
| POST /api/auth/forgot-password | email | Mail mode: same generic message for existing/missing accounts, no token in JSON. Unconfigured mail: 503. |
| POST /api/auth/reset-password | token, password, confirmPassword | Validates and atomically consumes token, updates hash and revokes all sessions. |

Name length is 2–100 after trimming. Indian phone rule is 10 digits starting 6–9. Email is normalized and validated server-side. Password is 8–128 characters with uppercase/lowercase/number/special and no whitespace, matching the user's requested regex policy. Confirm password is validated but never saved.

## Reset token explained in simple words

1. User account email enter karta hai. Backend fixed trusted APP_ORIGIN se reset URL banata hai; request Host header se nahi.
2. crypto.randomBytes(32) se 256-bit unpredictable token banta hai. Email, timestamps ya user ID token nahi bante.
3. Original token email link mein jata hai. Database mein sirf SHA-256 hash, user ID aur 15-minute expiry save hoti hai.
4. New reset request user ka previous reset token replace karti hai. Normal response se account existence/token reveal nahi hota.
5. Link /reset-password#token=... use karta hai. Fragment HTTP request/access logs mein nahi jata. React token memory mein capture karke address bar se replace-navigation se hata deta hai. Reload ke baad token intentionally memory se lost hota hai; email link dobara open karna hoga.
6. New passwords match aur policy check hone ke baad token JSON POST body mein backend ko jata hai. Deployment mein HTTPS required hai. Token localStorage/sessionStorage mein save nahi hota.
7. Backend submitted token hash karke database match/expiry check karta hai. SQLite transaction token ko consume aur password update ek saath karti hai. Concurrent two requests mein sirf one succeeds; expiry rechecked at commit.
8. Existing login sessions revoke hote hain. User new password se sign in karta hai. Reused/expired/incorrect link reject hota hai.

Gateway adds no-referrer, no-store, content-type protection and CSP. No external scripts or analytics on reset page. Mail failure logs never include reset URL, token, account email or provider response.

## Password and session controls

- Salted async scrypt: N=32768, r=8, p=3, 64-byte derived key, random 16-byte salt. Passwords are not stored or logged in plaintext.
- Session identifiers are random 32-byte values; database holds SHA-256 hashes. Cookie: HttpOnly, SameSite=Strict, Path=/, 8-hour Max-Age. Secure flag enabled for HTTPS APP_ORIGIN.
- API authorizes /me server-side. Frontend redirect alone is not the authorization boundary.
- Login compares against a dummy hash for missing accounts and checks password hash has not changed before session insertion.
- Parameterized SQL used for user-controlled values. JSON body limited to 16 KiB.
- Exact Origin allowlist and application/json writes reject simple cross-site submissions. No wildcard CORS. Local developer origins allowed only outside production.
- In-memory route limit 20 requests/minute and login/recovery per normalized-email limit 5/minute. Current gateway makes identity see one local IP; route throttling is shared in this local architecture. A production deployment needs trusted client-IP handling plus distributed throttling.
- No secrets are returned from /me; cookies are not exposed to frontend JavaScript.

## Email delivery and explicit limits

RESEND_API_KEY + MAIL_FROM enable the optional Resend HTTP adapter. Sender must be verified. Keys stay server-side. Without configuration, forgot-password returns 503. No real provider delivery was tested or emails sent during development.

Delivery is asynchronously scheduled in this local service so response behavior is not dependent on account/provider latency. It is NOT a durable job queue; service failure may lose pending email. Production needs a durable notification queue with retry/monitoring, sender verification and domain/DNS configuration. Password-change notification, email verification, MFA and administrator workflows are pending.

DEV_RESET_LINKS=true is explicit insecure local test mode: it returns the reset URL to the requester without proving email ownership. OFF by default. Launcher does not turn it on. NODE_ENV=production refuses this mode and refuses a non-HTTPS APP_ORIGIN. Never use demo mode on a public or real-user deployment.

This implementation is not a penetration test, independent security audit or claim of being vulnerability-free. Production additionally needs HTTPS/TLS ingress, tested reverse-proxy configuration, database backups/access controls, secret management, account verification, mail reliability, audit monitoring, distributed abuse controls and a deployment review.

## Full-screen layout fix

Previous fixed 740px desktop minimum plus outer page padding caused unnecessary vertical scroll on short displays. Mobile stacked marketing copy further increased height.

- Root padding removed for auth layouts; auth shell fills width and has min-height:100dvh.
- Mobile keeps only a compact brand bar, hiding marketing headline and illustration.
- Form fills remaining mobile space. Desktop illustration scales with viewport height; short displays hide decoration.
- No overflow:hidden on the document and no forced fixed form height: zoom, virtual keyboards, validation messages, accessibility font settings and long register forms can still scroll naturally.
- At browser-measured 1139×640, 325×703 and 325×556, login scrollHeight equalled viewport height with no horizontal overflow. Registration at 325×556 requires natural scrolling because it contains five inputs and guidance; controls are not clipped or made too small.

## Configuration

| Variable | Default / use |
| --- | --- |
| PORT | 3001, gateway. |
| IDENTITY_PORT | 4101, independent identity process. |
| APP_ORIGIN | http://127.0.0.1:3001; exact origin without trailing slash. Supervisor derives it from PORT if unset. |
| RESEND_API_KEY | Optional server-side sending API key. |
| MAIL_FROM | Optional verified sender. Both mail settings required. |
| DEV_RESET_LINKS | Off unless explicitly true; local test only. |
| NODE_ENV | production enforces HTTPS origin and disables developer origins/demo reset. |

No .env loader is present. Set environment variables before npm start, restart services after configuration changes. Use the IPv4 gateway URL for matching cookie/origin behavior. Vite development runs separately on 5173 and proxies to 3001.

## Verification

- TypeScript + Vite production build passed.
- Oxlint passed.
- Four real HTTP regression tests passed: registration/validation/duplicate email, incorrect login, authenticated profile, cross-origin rejection, logout, reset rotation, concurrent single-use token, session revocation, expired tokens/sessions, hashed DB secrets, account throttling, mail response non-disclosure, and disabled unconfigured recovery.
- Browser viewed login at desktop/mobile dimensions and navigated to registration; login fitting metrics recorded above.
- No real account/password was used for automated tests. Temporary test database is separate from the application DB.
- Real email delivery, physical phones/virtual keyboards, independent penetration testing and multi-instance deployment have not been verified.

## Sources checked

- https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- https://nodejs.org/api/crypto.html
- https://nodejs.org/api/sqlite.html
- https://github.com/resend/resend-openapi/blob/main/resend.yaml

## Next modules

Keep identity isolated. Next implement property and lead APIs behind the gateway with server-enforced user/role ownership, then notification worker and PostgreSQL migration. Do not treat placeholder dashboard cards as working CRM business modules.

