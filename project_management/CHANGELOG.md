# Change log

## 2026-10-20 — Initial login page and documentation

### Requirements

User ne property CRM ka first page simple login UI ke roop mein maanga, jise API se connect kar sakein. User frontend reference baad mein denge. Additional instruction: har project action project_management mein full explanation ke saath record ho aur kaam productive rahe.

### Inspection and decisions

- D:\CRM directory inspect ki; initial listing mein existing project files nahi mile.
- rg file-search command available nahi tha. Is limitation se implementation block nahi hua; directory inspection PowerShell se hui.
- Node version v26.0.0 verified. Existing frontend framework nahi tha, isliye plain HTML/CSS/JS aur built-in Node HTTP server choose kiya. No npm package installation required.
- Local page path /login aur frontend API path /api/auth/login choose kiya. Real endpoint AUTH_API_URL environment variable se configure hota hai.

### Implementation

- package.json: npm start command aur minimum Node 18 runtime defined.
- server.js: static routes, POST login proxy, request validation, timeout, generic errors aur security headers implemented.
- public/index.html: accessible labeled login form aur status region added.
- public/styles.css: simple responsive login card and focus states added.
- public/app.js: password toggle, API submit, loading and error states implemented.
- Local server started at http://localhost:3000/login during development.
- AGENTS.md added to retain user's requirement for detailed documentation in future work.
- project_management/README.md, LOGIN_PAGE.md, TASKS.md and this CHANGELOG.md created to explain the implementation and track work.

### Checks and results

| Check | Result |
| --- | --- |
| node --check server.js | Passed |
| node --check public/app.js | Passed |
| GET /login, /styles.css, /app.js, /missing | Attempted; environment socket access restriction prevented requests. HTTP results unverified. |
| POST /api/auth/login without AUTH_API_URL | Attempted; same socket restriction. Expected 503 from code, not verified at runtime. |

### Limitations and next step

Actual API unavailable, so valid/invalid user authentication against a backend is not verified. Local HTTP checks were blocked by the environment with: "An attempt was made to access a socket in a way forbidden by its access permissions." Server startup printed its listening URL; HTTP reachability still needs verification from the user's browser. Session handling and dashboard are not implemented. Browser visual QA remains pending. Full file responsibilities, run commands and API flow are documented in LOGIN_PAGE.md. Do not treat the page as a complete production login system yet.

## 2026-10-20 — Lavender login redesign

### Request and reference
User requested a design similar to image.png, with a different treatment and primary colour #C6A5FF. Reference image metadata and extracted text were available (Welcome Back, email and account links). Full visual inspection could not be completed: image byte materialization helper could not execute because installed Python aliases were unavailable. No claim of pixel matching is made.

### Changes and reasons
- public/index.html: replaced the single centered card with a two-column property story and login form. Left side has branding, a headline, a custom inline SVG house, decorative circular outline and small informational cards. Right side contains the working email/password form. Illustration is decorative and hidden from assistive technology.
- public/styles.css: defined --accent: #C6A5FF and used the exact colour for the story background and submit button. Dark plum text keeps labels legible against lavender. White form panel, soft off-white page background, rounded corners and restrained shadow create separation.
- Mobile layout below 650px stacks the panels and hides decorative illustration to keep the form easy to reach. Tablet spacing reduces below 900px.
- public/app.js: retains the original submit button markup after requests, preserving its arrow. Existing password toggle, validation, API request and status behavior retained.
- Existing /login and POST /api/auth/login paths remain in use. Actual API/session integration is still pending.
- Signup, password recovery and Remember Me were not added as interactive controls because corresponding backend flows are not implemented. Administrator access guidance is displayed instead.

### Tooling and checks
- No dependencies installed. Illustration is inline SVG; no external image requests or fonts needed.
- Reference retrieval first used an invalid prepare argument, then corrected to items. Temporary reference helpers were created; Python executable failed before any image bytes were downloaded.
- Initial patch format was rejected before changes applied; files were then written through PowerShell. A later patch transport error was recovered using a direct file edit.
- node --check public/app.js passed after redesign.
- Initial local fetch failed, so the local server was restarted. See follow-up verification below.
- Browser visual QA has not been performed. Actual authentication is unverified without backend details.

### Follow-up verification
Server restart attempt returned EADDRINUSE for 127.0.0.1:3000: a process already occupies the port, so no existing process was terminated. The earlier fetch could not connect from this environment; live page reachability remains unverified. Refresh /login in the browser to load the edited static files if the existing listener is this app. Temporary reference transfer data and downloaded helper source files were removed after the failed image materialization attempt.

## 2026-10-20 — Login URL access troubleshooting
- User reported localhost:3000/login does not open.
- Port inspection returned no usable listener information; process inspection was denied by CIM permissions.
- Attempted hidden persistent launch of this project's Node server. Startup failed with EADDRINUSE for 127.0.0.1:3000. No unknown listener was stopped.
- Direct local fetch failed with EACCES, so this execution environment cannot verify browser access. This is not proof of which process holds the port.
- Added start-crm.cmd in the project root. Double-click runs Node in a visible terminal with PORT=3001; uses the script's own directory, checks Node availability and keeps errors visible with pause.
- Open http://127.0.0.1:3001/login once the terminal prints the startup URL. The window must remain open. Ctrl+C stops the server. No dependencies or administrator permissions are required by the launcher.
- Alternate URL uses explicit IPv4 to match the server's 127.0.0.1 binding. Runtime availability of port 3001 on the user's host remains unverified.
## React authentication frontend — 2026-10-20

### Changes
- React + TypeScript frontend created inside frontend/.
- React Router installed for page navigation.
- Shared AuthLayout created for all authentication pages.
- Register form added: name, phone, email and two password fields.
- Shared password regex and matching validation added.
- Forgot Password and New Password screens added.
- Responsive lavender theme added using #C6A5FF.

### Verification
- Record actual page and validation checks here.
- Record npm run build result here.
- Record mobile/tablet checks here.

### Pending
- Registration API and server-side validation.
- Login API integration in React.
- Password reset email and token verification.
- Password hashing and session handling.
## 2026-10-20 — Automated React identity implementation and viewport/security fixes

User changed instruction from manual teaching to automated implementation. Inspected current frontend and reused existing React/TypeScript/Vite project, dependencies and password policy. Found duplicate CSS import and removed it. Replaced placeholder auth behavior with shared typed AuthForm, independent identity API, SQLite persistence, HttpOnly session cookies and protected starter dashboard. Added same-origin gateway and coordinated process launcher. No extra npm dependencies were installed.

User then reported unnecessary scroll on desktop/mobile and asked for secure reset-token handling. Replaced fixed minimum/padded card with full-viewport auth shell, compact mobile branding and height-aware desktop illustration. Actual browser login checks showed scrollHeight equals viewport height at measured desktop/mobile sizes, without horizontal overflow. Long registration form on a short mobile display still scrolls naturally to preserve accessible controls.

Reset: crypto-random 256-bit tokens, hashed persistence, 15-minute expiry, token replacement, atomic single use, old-session revocation, fragment-based links and address-bar cleanup. Salted async scrypt password hashes, parameterized SQL, exact Origin checks, JSON writes, bounded bodies and in-memory throttling added. Reset URL is NOT returned in normal mode. An early temporary launcher version enabled dev links; this was removed before final verification. Current launcher never enables demo mode. Dev mode is explicitly opt-in and forbidden in production. Optional server-only email provider adapter added; no emails sent or real delivery tested.

Node/SQLite used because available on this machine; FastAPI/PostgreSQL previously recommended remain future migration work. UI libraries discussed earlier were not installed because existing typed React/CSS forms were sufficient for this slice. Detailed file mapping, API contracts, configuration, flow and limits recorded in IMPLEMENTATION.md. Root README and current tracker updated; original static login docs retained as history.

Verification: production build and lint passed. Four real HTTP tests passed, including validation, duplicate accounts, wrong login, cross-origin rejection, reset replacement, concurrent token use, expired tokens/sessions, old-password rejection, session revocation/logout, hashed stored secrets, throttling and normal-mail response non-disclosure. Browser inspected desktop/mobile layouts and registration navigation. Service health verified separately through the gateway. No real-user accounts/passwords used in tests; isolated temporary DB cleaned up.

Development investigation used temporary test gateway 3101/identity 4102, then started normal gateway 3001/identity 4101. Earlier blocked socket checks from prior turns no longer describe current verification: current HTTP tests run successfully. Test and build outputs recorded as results, not claims of production certification.

Remaining: actual email provider config/delivery, durable notification queue, independent security review and production deployment controls; property/lead business APIs, role enforcement and database migration. See IMPLEMENTATION.md for the complete current scope.

Final handoff verification: http://127.0.0.1:3001/login and /api/auth/health returned 200; existing Vite frontend /login also returned 200. Browser followed the Reset password link successfully at the normal gateway URL. Final mobile browser measurement was 386×692 with page dimensions 386×692. Temporary viewport override reset and final login tab retained. Temporary 3101/4102 test supervisor stopped. Normal 3001/4101 supervisor left running. Demo recovery was also made mutually exclusive with real mail delivery, so opting into a disposable test cannot inadvertently send mail.

## 2026-10-20 — Connect existing local MongoDB and show setup

User requested a database named cashflow proptee on localhost, with visible explanation. MongoDB disallows spaces, so database created as cashflow_proptee. Verified existing MongoDB 8.3.11 on 127.0.0.1:27017; bindIp was 127.0.0.1 and authorization was not configured. No server network/security settings were changed. Checked original SQLite accounts twice: zero users; original file retained, no migration necessary.

Official mongodb driver installed (12 packages; install audit reported zero vulnerabilities). Added Mongo store and extracted legacy SQLite adapter for regression tests. Normal startup always connects MongoDB and does not silently fall back. users collection has unique normalized email and sparse unique reset-hash indexes. sessions has TTL expiry and user lookup indexes. Password reset uses one atomic user-document update to replace password hash, consume reset state and increment authVersion. Session authorization checks versions, preventing stale-session reuse including a racing login. No TTL index placed on user reset expiry because that could delete the account.

Desktop Computer Use skill was read; skill-resource callback unavailable, so bundled documentation was read from its known filesystem path. Native helper launch failed with program-not-found. No Compass actions were falsely claimed. Opened a visible read-only browser walkthrough on 3102 showing connection, steps, actual verified collection counts and changed file paths. The walkthrough does not expose user documents/secrets. Status is a verified snapshot, not a live database admin interface.

Added Mongo integration test on a unique disposable database and a safe db:check script. Four existing auth tests and the new Mongo test passed. Mongo test checks input/NoSQL-operator rejection, duplicate emails, salted hashes, sanitized profile, hashed tokens, reset replacement, concurrent single-use token, session versioning/stale-login race, expiry, indexes and persistent reconnect. Disposable test DB was removed; application users/sessions remained empty. Frontend build and lint also passed after user-ID typing update.

Stopped/replaced no unknown system service. The previous supervised app session was no longer present and old gateway connection was refused; started updated application normally. Documentation in MONGODB.md details every file, commands, schema, connection and production limitations; README/current tracker updated. No real email or user credential used in testing.
# 2026-10-20 — Swagger and connected local testing

Added seven-endpoint OpenAPI contract, locally hosted Swagger UI, development-only documentation routes, UTF-8 body decoding and query preservation. Added explicit local-test launcher for reset without email. Auth/MongoDB tests (5) and frontend build passed. Full file explanations, test workflow and encoding/security boundaries: SWAGGER_API.md. Local test server restarted on 3001; MongoDB remains cashflow_proptee.

# 2026-10-20 — Single localhost routes and manual startup

Added /swagger/index.html and GET /health to gateway; existing root serves React. Default origin now localhost; exact development origin compatibility retained. Full commands, file explanations and health response meanings: LOCAL_ROUTES.md. No user data or database schema modified.


Verification (localhost routes): temporary gateway 43001 / identity 44101 against local MongoDB. Root, Swagger, legacy docs, OpenAPI and health returned 200; health reported mongodb. POST health returned 405; localhost POST origin accepted and invalid login fields returned 400. Temporary processes stopped; no account created. Restart manual services to load changes.
# 2026-10-20 — Proptee branding

Changed frontend browser title and visible auth brand to Proptee; Swagger title Proptee | Swagger. Created local SVG favicon/logo and extracted shared house illustration into a separate SVG file. Updated responsive selectors for external img. Full mapping and manual replacement instructions: PROPTEE_BRANDING.md. No runtime services or account data changed.


## 2026-10-25 - Super admin design
Inspected identity handlers, Mongo/SQLite adapters, gateway and React dashboard/client. Added SUPER_ADMIN_PLAN.md and README index with password/session/authorization separation, immutable-ID binding, CRUD scope, affected files, validation cases, limitations and next steps. Existing salted scrypt can be reused. No runtime code, users or database changed; no live session checks run. Role enforcement, admin CRUD/audit/MFA and business APIs remain pending. Shashank identity must be verified before bootstrap. OWASP storage/authorization references checked. Initial patch write failed; PowerShell file write succeeded. No credentials recorded.

## 2026-10-25 - Login colour update
User requested #3C0C61 for login. Added a login-theme class through AuthForm.tsx and an optional className in AuthLayout.tsx. frontend/src/index.css scopes the exact accent to login: brand panel and primary button use #3C0C61, with white foreground text, light supporting copy, matching links/input focus and a darker button hover. Floating illustration card retains dark text for its white background. Other auth screens retain their existing theme. No authentication behavior or database changes.
Verification: npm run build and npm run lint passed. Browser visual inspection was not performed. Next step: refresh the running login page; restart only if the current server serves an older build. No new dependencies or tests added for this visual-only change.
