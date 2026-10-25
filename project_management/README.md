# Property CRM — Project Management

Current database update: **MONGODB.md**. Authentication implementation: **IMPLEMENTATION.md**. Run instructions: root README.md.

| File | Purpose |
| --- | --- |
| IMPLEMENTATION.md | Current React/API architecture, every affected file, reset flow, security controls, configuration and verification. |
| CHANGELOG.md | Date-wise actions and implementation decisions. |
| TASKS.md | Current completion and pending work. |
| LOGIN_PAGE.md | Original static-page history; superseded by IMPLEMENTATION.md for running the app. |

Har meaningful change ke saath purpose, affected files, working flow, checks, limitations aur next step update hoga. Passwords, tokens, keys aur real credentials kabhi record nahi karne.

Current stack: existing React + TypeScript + Vite frontend, local Node identity service with MongoDB database cashflow_proptee, Node gateway. Plain HTML server files remain as legacy reference. No unnecessary new UI packages were installed. PostgreSQL/FastAPI migration and other CRM business services are future work.


- SUPER_ADMIN_PLAN.md: Proposed Shashank-only admin dashboard, secure flow, implementation sequence and acceptance tests. Design only; not implemented.
