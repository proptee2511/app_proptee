# Swagger, connected account pages and local testing

Updated: 20 October 2026.

## Kya ready hai

Frontend React forms -> same-origin gateway on 127.0.0.1:3001 -> identity service on 127.0.0.1:4101 -> MongoDB on 127.0.0.1:27017, database `cashflow_proptee`. Existing real account APIs were reused, not duplicated. Business modules (property/leads) are still pending.

Open http://127.0.0.1:3001/login for CRM and http://127.0.0.1:3001/api-docs for Swagger. Raw contract: http://127.0.0.1:3001/api/openapi.json. Swagger Try it out executes real requests and writes to the connected database.

## Page/API mapping

| Page/action | Method and endpoint | Result |
| --- | --- | --- |
| Register | POST /api/auth/register | name, phone, email, password, confirmPassword; saves hashed password |
| Login | POST /api/auth/login | Valid credentials set an HttpOnly session cookie |
| Dashboard | GET /api/auth/me | Returns only current user's id, name, email, phone |
| Logout | POST /api/auth/logout | Send {}; deletes session and clears cookie |
| Forgot password | POST /api/auth/forgot-password | Sends email if configured; explicit local mode displays link |
| Reset password | POST /api/auth/reset-password | token, password, confirmPassword; one-use 15 minute reset, revokes sessions |
| Connection check | GET /api/auth/health | Pings MongoDB and reports status |

## File-by-file explanation

- `api/openapi.js`: OpenAPI 3.0.3 contract; seven endpoint definitions, request fields, validation patterns, response codes and cookie authentication. Documentation does not enforce validation; identity/app.js does. Update both together when adding an endpoint.
- `api/docs.html`: Swagger page with CRM/spec navigation and a local testing notice.
- `api/init.js`: Loads same-origin specification, enables browser cookies, disables external online validator and saved authorization. Login through Swagger first, then execute /me. Browser manages HttpOnly cookie; do not paste it into Authorize.
- `api/theme.css`: Lavender #C6A5FF header and mobile-friendly navigation.
- `gateway.js`: Serves allowlisted Swagger assets from local swagger-ui-dist dependency; serves JSON specification; disables documentation routes in production. Swagger alone permits inline styles required by UI; scripts remain same-origin. Existing CRM CSP unchanged. API forwarding now preserves encoded query strings instead of dropping them.
- `services/identity/app.js`: Explicit UTF-8 JSON response charset. Body is collected as bytes with a 16 KiB limit and decoded once using fatal UTF-8 decoding. This prevents split Hindi/Unicode characters being corrupted and rejects malformed UTF-8 rather than silently replacing it.
- `package.json` / `package-lock.json`: Adds swagger-ui-dist (local assets, no CDN) and start:local-test command.
- `scripts/start-local-test.js`: Explicitly opts into local reset-link mode, refuses production, then uses existing two-service launcher.
- `start-local-test.cmd`: Builds frontend and launches that mode for double-click testing. Existing start-crm.cmd / npm start retain normal mail configuration behavior.

## Khud test kaise karein

1. MongoDB service running honi chahiye. Current session has local test server running. Next time, stop an already running CRM with Ctrl+C, then double-click start-local-test.cmd or run npm run build followed by npm run start:local-test. Do not run two copies on the same ports.
2. Open /register. Use a test account, 10-digit Indian mobile beginning 6-9, valid email syntax, and matching passwords (8-128 characters, uppercase, lowercase, number, symbol, no spaces).
3. Sign in; dashboard should show your saved profile. Logout; dashboard must require login again.
4. Open /forgot-password with the same email. In this local mode no email is sent. The page explicitly shows a Local development only link. Open it and choose a new matching password.
5. Old password must fail; new password should log in. Used/expired reset link must fail. Existing sessions become invalid after a successful reset.
6. In Swagger expand an endpoint, choose Try it out, replace generated placeholder fields with valid test data, then Execute. Register returns 201, login 200, /me 200 when signed in or 401 otherwise. For logout send {}. Rate limits can return 429; wait a minute before retrying.
7. Same-origin tabs share session cookies: logout/reset from Swagger also affects the CRM. Use 127.0.0.1 consistently rather than mixing localhost and 127.0.0.1.

## Encoding aur encryption ka difference

JSON serialization + UTF-8 encodes request/response data. Query parameters should be constructed using URLSearchParams, path segments with encodeURIComponent; never put passwords/reset tokens in query strings. Current account endpoints use JSON POST bodies and do not require query parameters. Browser parses JSON with response.json().

Base64 is reversible encoding and provides no confidentiality, so blanket Base64 wrappers were not added. Local HTTP requests are NOT encrypted. HTTPS is required for real encrypted transport in deployment; a trusted TLS reverse proxy/certificate remains to be configured. APP_ORIGIN=https alone does not install TLS. Passwords use salted scrypt hashes, session/reset secrets use SHA-256 hashes; these are separate protections for stored secrets. Profile fields are ordinary database data, not field-encrypted.

Local reset-link mode intentionally removes email ownership verification for learning. Use test accounts only. It is off with npm start, forbidden in production, and services bind to loopback. Do not publish this test mode or tunnel it publicly. Production needs actual mail delivery, HTTPS, authenticated MongoDB, shared rate limits for multiple instances and security review; this setup is not a security certification.

## Verification

- npm install swagger-ui-dist completed, package audit reported 0 vulnerabilities (not a security guarantee).
- npm test: all 5 auth/MongoDB tests passed: registration, duplicate validation, sessions, reset rotation/single use/expiry, session invalidation and persistence. Tests use temporary storage/database, not real customer accounts.
- npm run build: TypeScript and Vite build passed.
- Swagger browser rendered all 7 endpoints and schemas successfully. Try it out / Execute returned HTTP 200 with {"status":"ok","storage":"mongodb"}; response charset is UTF-8.
- Existing app process was stopped through its owned terminal session and restarted with npm run start:local-test; no unrelated process was stopped. Process inventory via CIM was unavailable, so owned session control was used.
- Real email delivery is not configured/tested. Manual browser account creation/reset is left for the user's own chosen test credentials.
- First live Swagger request failed because the npm-launched server stopped. Automatic review rejected an unrelated dc.services.visualstudio.com telemetry request. No telemetry workaround was attempted; the necessary local app was started directly with `node scripts/start-local-test.js`. Swagger retry then succeeded with MongoDB. This direct command is also available if the npm wrapper is interrupted.

References: https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/ ; https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
