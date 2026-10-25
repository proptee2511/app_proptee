# Property CRM

Responsive React + TypeScript authentication frontend with a separate local identity API and a same-origin gateway. Theme: `#C6A5FF`.

## Run on Windows

Node.js 24 or newer is required (development verified on Node 26). Dependencies already installed in frontend; on a new checkout run `npm ci` and `npm --prefix frontend ci` first.

Double-click **start-crm.cmd**, or run:

```powershell
cd D:\CRM
npm run build
npm start
```

Open **http://127.0.0.1:3001/login**. Keep the terminal open; Ctrl+C stops both processes. Use this exact IPv4 URL for the built application, rather than mixing localhost and 127.0.0.1 origins.

Registration, login, account details and logout use local MongoDB at `mongodb://127.0.0.1:27017`, database `cashflow_proptee`. The previous SQLite file is retained as a legacy backup; runtime startup uses MongoDB. No default account is created. Properties/leads/follow-up modules are placeholders, clearly marked in the authenticated workspace.

## Password recovery

Recovery fails explicitly until email delivery is configured. It does not falsely claim an email has been sent. Optional Resend integration uses these server-only environment variables:

```powershell
$env:RESEND_API_KEY = '<your sending API key>'
$env:MAIL_FROM = 'Property CRM <accounts@your-verified-domain>'
npm start
```

Use a verified sender supported by the provider. Do not commit keys or put them in VITE_ variables. The application does not automatically load a .env file. No real email delivery has been verified in this workspace.

For disposable local testing only, explicitly opt in before starting:

```powershell
$env:DEV_RESET_LINKS = 'true'
npm start
```

This bypasses email possession by returning a reset link to the requesting browser. Never use it with real users or on an exposed deployment. It is OFF by default, the launcher does not enable it, and NODE_ENV=production rejects it. Disable with `Remove-Item Env:DEV_RESET_LINKS` and restart. Automated tests enable it only for isolated test servers.

## Frontend development

Keep `npm start` running for APIs. In another terminal:

```powershell
cd D:\CRM\frontend
npm run dev
```

Open the Vite URL printed in the terminal, normally http://127.0.0.1:5173. Vite proxies /api to the gateway on 3001. Only these explicit 5173 development origins are allowed by the identity startup script; production accepts APP_ORIGIN only.

## Verification and project records

```powershell
npm test
npm run build
npm run lint
```

See `project_management/IMPLEMENTATION.md` for file responsibilities, API contracts, architecture, reset security, configuration and remaining work. This is a local foundation, not a completed production CRM or a security certification.


## Local MongoDB

Run npm run db:check to inspect the connection, collections and indexes. See project_management/MONGODB.md for exact configuration, reset atomicity and Compass/mongosh steps. The read-only walkthrough starts with npm run setup:view at http://127.0.0.1:3102. Local MongoDB must be running before npm start or npm test.

# API explorer and local account testing

Swagger: http://127.0.0.1:3001/api-docs (development only).
Use `npm run start:local-test` or `start-local-test.cmd` to display reset links locally without email. Use test accounts only; normal `npm start` keeps this mode off. Stop any existing CRM process first. Detailed API mapping, encoding explanation and manual workflow: [project_management/SWAGGER_API.md](project_management/SWAGGER_API.md).

# Manual localhost URLs

Frontend: http://localhost:3001/ — Swagger: http://localhost:3001/swagger/index.html — MongoDB status: http://localhost:3001/health.
Manual two-terminal commands: [project_management/LOCAL_ROUTES.md](project_management/LOCAL_ROUTES.md).

