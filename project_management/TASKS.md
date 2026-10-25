# Current task tracker — 2026-10-20

| Task | Status | Notes |
| --- | --- | --- |
| Reuse user's React + TypeScript project | Done | Existing code preserved structurally and refactored into shared components. |
| #C6A5FF responsive auth UI | Done | Full-screen desktop; compact mobile branding. |
| Login viewport fitting | Verified | Browser-measured 1139×640, 325×703 and 325×556: no login overflow. |
| Register with name/phone/email/two passwords | Done | Frontend and server-side validation; hashed persistent password. |
| Login, session profile, logout | Done | HttpOnly cookies; server-authorized /me. |
| Expiring single-use reset tokens | Done | Hashed token persistence, rotation, atomic consumption, session revocation. |
| Recovery email adapter | Implemented, not configured | Optional Resend integration; real delivery not tested. Missing config returns 503. |
| Demo reset exposure | Off by default | Explicit local test mode only, forbidden in production. |
| Local service separation | Done | React → gateway → independent identity API using local MongoDB. |
| Regression tests | Passed | Four HTTP tests cover happy paths and security regressions. |
| TypeScript/build/lint | Passed | No new package installation required. |
| Property/lead/follow-up modules | Pending | Dashboard cards explicitly marked coming next. |
| PostgreSQL/FastAPI/Nginx/Docker deployment | Pending | Local implementation currently uses Node/SQLite. |
| Production controls and security review | Pending | HTTPS ingress, reliable mail queue, distributed throttling, account verification, audit/backup strategy. |
| Physical device/keyboard/zoom testing | Pending | Browser viewport checks completed, not a physical-device certification. |

Detailed explanation and limits: IMPLEMENTATION.md. Historical entries remain in CHANGELOG.md.


## MongoDB update
- Done: cashflow_proptee created on existing local MongoDB; users/sessions collections and indexes verified.
- Done: startup connects MongoDB before listening; health pings actual database.
- Done: atomic reset consumption and session-version revocation on standalone MongoDB.
- Done: original four tests plus a Mongo-specific integration test passed.
- Done: visible browser setup walkthrough; native Compass automation blocked by unavailable desktop helper.
- Pending: mail delivery configuration and production MongoDB authentication/deployment review.

# Swagger / local account testing update

- Done: Swagger UI, seven account/system API contracts, connected frontend/backend/MongoDB and explicit local reset testing launcher.
- Done: five backend tests and frontend build.
- Pending: real reset email provider and trusted HTTPS deployment; business property/lead APIs remain pending.
- See SWAGGER_API.md for manual account-testing steps and detailed changed-file explanations.

