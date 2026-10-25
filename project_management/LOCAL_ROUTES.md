# Manual startup with one localhost address

20 October 2026

Requested URLs now use the gateway on port 3001:

| URL | Behavior |
| --- | --- |
| http://localhost:3001/ | Built React frontend; existing router opens login |
| http://localhost:3001/swagger/index.html | Swagger UI for the backend account endpoints |
| http://localhost:3001/health | Live MongoDB ping via identity service; JSON status |

Swagger is an API explorer, not the backend process itself. Backend remains a separate process on 4101. MongoDB remains on 27017; /health is a status check, not a database administration page. HTTP 200 with status ok and storage mongodb means MongoDB answered the ping. Database outage returns 503 when identity is running; unavailable identity returns 502. All services remain local-only.

## Manual commands

Ensure MongoDB Windows service is running. Stop an old CRM launcher with Ctrl+C before using the same ports.

Terminal 1 (PowerShell):

```powershell
cd D:\CRM
$env:PORT="3001"
$env:IDENTITY_PORT="4101"
$env:APP_ORIGIN="http://localhost:3001"
$env:MONGODB_URI="mongodb://127.0.0.1:27017"
$env:MONGODB_DB="cashflow_proptee"
$env:DEV_RESET_LINKS="true"
node services/identity/start.js
```

Local reset mode displays the reset link without sending mail. Use test accounts only; it is forbidden in production.

Terminal 2:

```powershell
cd D:\CRM
npm run build
$env:PORT="3001"
$env:IDENTITY_PORT="4101"
node gateway.js
```

Keep both terminals open. No combined launcher is necessary. The gateway serves the built frontend, so a separate npm run dev is not needed for these URLs. After frontend source changes, run npm run build again. The optional Vite development server still runs separately on 5173 for hot reload; these new canonical URLs are on 3001.

## Changes and reasons

- gateway.js: added /swagger/index.html as a Swagger document route using existing local assets and production restrictions. Existing /api-docs works too. /health forwards GET to the existing /api/auth/health endpoint, preserving real response status. Other methods get 405. Startup logs show the three requested URLs. Existing root SPA serving is reused.
- services/identity/start.js: default APP_ORIGIN now uses localhost and configured gateway port, so reset links use the requested hostname. Development allows exact localhost and 127.0.0.1 gateway origins, as well as existing Vite origins. Production does not get those extra origins. Cookies belong to each hostname, so consistently use localhost and sign in again when switching from 127.0.0.1.
- scripts/start.js: optional combined launcher default origin matches manual startup; it is not required for the manual workflow.
- No database schema changes, data changes, new dependencies or MongoDB administration exposure.

## Verification

Verification result recorded in CHANGELOG.md. Temporary verification processes use separate local ports and are stopped afterwards; user's manual services are not stopped.
