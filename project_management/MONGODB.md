# Local MongoDB setup — Cashflow Proptee

## Result

Application database: **cashflow_proptee**

Connection: **mongodb://127.0.0.1:27017/cashflow_proptee**

User requested the name `cashflow proptee`. MongoDB prohibits spaces in database names, so the technical name uses an underscore and preserves the requested spelling. Display name can remain Cashflow Proptee.

MongoDB 8.3.11 was reachable on the user's existing localhost server. Server configuration reported bindIp=127.0.0.1. Authentication was not configured on this existing installation; no authentication/network/server settings were changed. This is local development, not a claim that local unauthenticated access is production-ready.

## What you see on screen

Read-only walkthrough: http://127.0.0.1:3102

It shows actual setup progress, verified database/collection counts and affected files, without exposing user documents/password hashes/tokens. It refreshes the status snapshot every three seconds; database counts are taken during verification rather than queried continuously by the browser.

The Windows Computer Use helper failed with `failed to launch codex app-server: program not found`, so native Compass control was unavailable. Instead, the setup walkthrough was opened visibly in the in-app browser. No claim is made that Compass was controlled or that every code edit happened inside a visible editor.

To reopen the walkthrough later, run `npm run setup:view`, then open its URL. It is a separate localhost-only teaching view; it is not an authenticated database admin interface or part of the deployed CRM.

## Which files changed and why

| File | Change and reason |
| --- | --- |
| package.json / package-lock.json | Installed official mongodb Node driver; root npm ci now required on a fresh checkout. Test script includes legacy and Mongo regression tests. Added db:check and setup:view. |
| services/identity/mongo-store.js | MongoClient connection, database selection, indexes, user/session/reset persistence. Uses one connection pool per service process. |
| services/identity/sqlite-store.js | Extracted the legacy adapter for isolated regression tests. It is not selected by normal application startup. |
| services/identity/app.js | Storage operations now await a store interface. Strong-password checks, cookies, rate limits and origin checks retained. Phone values now require a string to prevent object-shaped input reaching storage. |
| services/identity/start.js | Connects MongoDB before listening. Defaults to local MongoDB/cashflow_proptee; fails startup if connection fails. No silent SQLite fallback. Mail-provider integration retained. |
| services/identity/mongo.test.js | Real HTTP regression test against a unique disposable Mongo database, cleaned after testing. |
| frontend/src/services/api.ts | User ID supports UUID string returned by Mongo and legacy numeric test IDs. |
| scripts/check-mongodb.js | Safe read-only connection/collection/count/index check; prints no account documents, credentials or hashes. |
| scripts/mongo-walkthrough.js | Local read-only setup status display on 3102. |
| project_management/mongo-status.json | Sanitized progress snapshot used by the walkthrough. |
| project_management/mongo-walkthrough.html | Visible teaching page showing connection, progress and file locations. |
| .env.example | Reference configuration only, no secrets and no automatic loading. |
| README.md / project_management records | Updated current database, commands, test results and remaining limitations. |

## Collections

| Collection | What it stores | Indexes |
| --- | --- | --- |
| users | UUID _id, name, phone, normalized email, passwordHash, authVersion, createdAt; temporary reset subdocument when requested | _id, unique_email, sparse unique_reset_hash |
| sessions | Hashed token as _id, userId, authVersion, expiresAt, createdAt | _id, session_user, expire_sessions TTL |

No fake accounts were inserted into cashflow_proptee. It starts with zero users and sessions. Register from the CRM to create your own account. The old SQLite database was checked twice, including before switching: zero accounts. Original file remains untouched at services/identity/data/identity.sqlite. No account migration was required.

Passwords remain salted scrypt hashes. Confirm password is only validated, never saved. Sessions store a SHA-256 token hash; the raw session value stays in the HttpOnly cookie. /me returns only id, name, email and phone.

## Why reset data is inside users

Your local MongoDB runs as a standalone server. Multi-document transactions would require a replica set, so the reset design does not depend on them.

1. Reset request stores users.reset.tokenHash and users.reset.expiresAt, replacing any older token for this account.
2. Backend hashes the incoming token and checks exact match plus expiry.
3. One conditional update sets passwordHash, increments authVersion and removes reset. This entire document update is atomic.
4. Only one concurrent request can match the token. A second use fails because reset has been removed.
5. Each session carries the authVersion from login. /me requires its version to equal the current user version, so old sessions immediately lose access after a reset—even if a stale login finishes after the reset.
6. Old session documents may remain until their TTL expiry; they are already invalid for authentication. Expiry is also checked during every session lookup because Mongo TTL cleanup is asynchronous.

There is deliberately NO TTL index on users.reset.expiresAt. A TTL index there would delete the whole user document. Reset expiry is enforced in the API/store query instead.

The existing 15-minute reset expiry, unpredictable 256-bit token, fragment-based email link, no-referrer policy, single use and default-disabled demo links remain in place. Real reset email still requires mail-provider configuration.

## Local configuration

Defaults work without setting environment variables:

```powershell
cd D:\CRM
npm run build
npm start
```

Open http://127.0.0.1:3001/login. Vite development remains on 5173 with /api proxied to 3001. Browser connects to API; it does not connect directly to MongoDB.

Equivalent explicit server settings:

```powershell
$env:MONGODB_URI = 'mongodb://127.0.0.1:27017'
$env:MONGODB_DB = 'cashflow_proptee'
npm start
```

Database name is selected separately with client.db(MONGODB_DB); changing only the URI's database suffix does not override MONGODB_DB. Use 127.0.0.1 to avoid localhost IPv6-resolution mismatch. Never put database credentials in frontend/VITE_ variables.

## Inspect it yourself

Read-only application check:

```powershell
cd D:\CRM
npm run db:check
```

Mongo shell:

```powershell
mongosh "mongodb://127.0.0.1:27017/cashflow_proptee"
```

Inside mongosh:

```javascript
db.getName()
show collections
db.users.countDocuments({})
db.sessions.countDocuments({})
db.users.getIndexes()
db.sessions.getIndexes()
```

To inspect user profile fields after registration, explicitly project only safe fields:

```javascript
db.users.find({}, { name: 1, phone: 1, email: 1, createdAt: 1 })
```

In MongoDB Compass, connect using mongodb://127.0.0.1:27017, refresh databases, select cashflow_proptee, then select users or sessions. There is no separate password-reset collection because reset state is embedded in users for atomicity.

## Verification

- Mongo ping passed and server version/bind address checked.
- Database created by collections/index setup and verified with mongosh.
- Unique email and reset-hash indexes confirmed; session TTL set to expireAfterSeconds:0.
- Four existing HTTP auth tests passed after store extraction.
- Mongo-specific test passed: validation, duplicate email, operator-shaped input rejection, wrong origin, persistent salted hashes, sanitized profile, hashed sessions/tokens, reset replacement, concurrent single use, immediate old-session rejection, stale-login race, logout, expiry, safe TTL indexes and persistence after reconnect.
- Test uses a UUID-named crm_test_* database, verifies its exact naming pattern before dropping it, and never drops/clears the application database.
- Application startup waits for Mongo connection; health now pings the database and returns storage:mongodb when connected.

## Sources checked

- https://www.mongodb.com/docs/v8.0/reference/limits/
- https://www.mongodb.com/docs/drivers/node/current/indexes/
- https://github.com/mongodb/node-mongodb-native

## Remaining production work

Database authentication with a least-privilege account, TLS as appropriate, backups, access controls and monitoring must be planned before deployment. No global MongoDB auth settings were changed because this is the user's existing local instance. Existing mail/deployment/security-review limitations still apply.
