# Security and Production Readiness Review

## Scope and verdict

This is a read-only source/configuration review of the current checkout. No application code was changed. The local `.env` values and any deployed infrastructure settings were not read or verified. The checkout already contained unrelated uncommitted changes; this review commit includes only this document.

**Go-live status: not ready for production student records** until the shared student password and cross-college reference issues are resolved, and backup/restore capability is verified in the target environment.

## Security findings

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🔴 CRITICAL | `src/app/api/v1/college/students/route.ts`; `src/app/api/v1/college/students/import/route.ts`; `src/app/college/students/page.tsx` | 43; 120; 94 | Student creation and CSV import fall back to the same known password (`StudentPass!23`). Accounts created without an explicitly supplied password share a credential. | 10/10 |
| 2 | 🔴 CRITICAL | `src/app/api/v1/college/offerings/route.ts`; `src/app/api/v1/college/students/route.ts` | 37-42; 39-66 | Related IDs are accepted and written under the caller's college without verifying that referenced courses, faculty, programs, and departments belong to that college. This can create cross-tenant associations and expose or corrupt institutional records. | 9/10 |
| 3 | 🟠 HIGH | `src/backend/lib/rate-limit.ts`; `src/app/api/v1/auth/login/route.ts`; `src/app/api/v1/auth/forgot-password/route.ts` | 1-15; 42; 22 | Authentication limits use process-local memory, so counters are not shared across instances and reset on restart. The caller IP is derived from `x-forwarded-for`, which also requires a trusted proxy that overwrites/normalizes it. Distributed deployments may not meaningfully limit abuse. | 9/10 |

## Other production-readiness findings

| Priority | Finding and impact | Evidence | Required action |
|---|---|---|---|
| BLOCKER (environment gate) | Backup/PITR configuration and a successful restore have not been verified. This is not confirmed absent; deployment-provider settings are outside this checkout. Loss of student, attendance, and fee records would be severe. | `architecture.md` explicitly says to configure and verify backups and restore procedures. | Provide evidence of backup retention, point-in-time recovery where available, and a tested restore before go-live. |
| BLOCKER (release gate) | The working tree contained numerous pre-existing modified and untracked application files. A clean, reviewed release commit could not be established from this checkout. | `git status --short` during the audit. | Review, test, and deploy a known commit; do not deploy an unreviewed working tree. |
| HIGH | Student dashboard pages substitute fabricated courses, timetable, attendance, marks, fees, and notices whenever a student's saved list is empty. The notice labels it as sample data, but real users can still see misleading academic/financial information. | `src/app/student/page.tsx:47-57`; related student pages use the same empty-list fallback. | Restrict demo data to an explicit demo/development mode; show an empty state for real accounts. |
| HIGH | College deletion commits before writing an audit entry that references the deleted college. With the audit foreign key, the request can fail after the college has already been deleted, leaving no successful response and no audit record. | `src/app/api/v1/admin/colleges/[id]/route.ts:65-79`. | Make deletion and audit behavior transactionally consistent; preserve a valid audit reference or write the audit before deletion. |
| HIGH | The documented production schema workflow is `drizzle-kit push`; no checked-in versioned migration workflow was found. This makes changes harder to review, reproduce, and roll back safely. | `README.md`; `architecture.md` deployment section. | Adopt reviewed, versioned migrations and test applying them to a production-like database before release. |
| HIGH (feature configuration) | Password reset delivery is optional in the docs. Without `RESEND_API_KEY`, production logs that email was not sent, while the forgot-password endpoint intentionally returns the same accepted response. An unverified/default `MAIL_FROM` or incorrect `APP_URL` can also prevent usable reset links. | `src/backend/lib/mail.ts`; `src/app/api/v1/auth/forgot-password/route.ts`; environment tables in `README.md` and `architecture.md`. | Configure and test the provider, verified sender, and canonical application URL before advertising password recovery. |
| MEDIUM | The health endpoint tests only `SELECT 1`; it can report healthy even when application tables/migrations are unavailable. | `src/app/api/health/route.ts:7-18`. | Separate liveness from readiness and have readiness check the required schema/version without exposing secrets. |
| MEDIUM | No deployment workflow, Dockerfile, or Vercel-specific configuration was found. The app can use standard Next.js deployment, but automated release/build gates and deployment-target-specific connection behavior are unverified. | Repository file inventory. | Add CI checks and document the chosen runtime, environment configuration, and deployment procedure. |
| MEDIUM | PostgreSQL pool settings use `pg` defaults and are not sized against the deployment's instance count or database connection budget. | `src/backend/db/index.ts`. | Confirm total connection capacity and configure a suitable pooler/limits for the actual host and database plan. |
| MEDIUM | Application logs are primarily direct `console` calls; the architecture document notes that application logs are not a complete monitoring/alerting system. No operational alerting or incident/retention configuration is evidenced here. | `src/backend/lib/mail.ts`; `architecture.md` operational constraints. | Configure platform monitoring, error alerts, request correlation, audit retention, and incident ownership. |
| MEDIUM | The repository contains 11 moderate development-tool dependency advisories (including `esbuild` and `minimatch`); the production-only audit reports zero vulnerabilities. | `npm audit`; `npm audit --omit=dev`. | Track and update the affected development toolchain without forcing breaking dependency downgrades. |
| MEDIUM | The README instructs copying `.env.example`, but no `.env.example` is present. The local `.env` is ignored and not tracked; its values were not inspected. | `README.md` local setup; repository file inventory. | Add a values-free environment template and verify required production secrets in the deployment secret manager. |
| MEDIUM | No custom App Router error boundary files were found. Unexpected server-rendered page failures may therefore lack an application-specific recovery path and user-facing error handling. | `src/app` file inventory. | Add an appropriate root error boundary and ensure server-side failures are logged without disclosing internals. |
| MEDIUM | Prior UI review found keyboard/focus and semantics gaps in the mobile navigation, low-contrast slate text, and asynchronous form feedback without live-region semantics. | `src/frontend/components/app-shell.tsx`; `src/app/globals.css`; affected forms. | Validate keyboard, screen-reader, and contrast behavior before institutional use. |
| LOW | Root metadata contains only a title and description; no public-site Open Graph, canonical, robots, or sitemap configuration was found. | `src/app/layout.tsx:13-16`; App Router file inventory. | Add public-page metadata if discoverability/social previews are part of the launch requirements; keep private portal routes out of indexing. |
| LOW | Uploaded file bytes are stored in PostgreSQL, increasing database growth and backup/restore cost as usage scales. | `architecture.md` file storage section. | Set upload limits and retention; evaluate object storage when measured growth justifies it. |

## Positive evidence

- Production dependency audit: **0 known vulnerabilities**. Full audit: **11 moderate advisories in development tooling**, with no high or critical advisories reported.
- The most recent recorded validation after dependency remediation passed the production build, TypeScript check, ESLint, and seven Node tests. These are not end-to-end production workflow tests.
- Production session setup fails closed when `SESSION_SECRET` is absent; the session cookie is HTTP-only, SameSite=Lax, and Secure in production.
- Passwords use a password-hashing helper, API inputs use Zod validation, and demo database seeding is restricted to development.
- `DATABASE_URL` is required. The local `.env` is ignored by Git and no `.env*` file was tracked; actual secret values and deployed configuration were not inspected.

## Go-live checklist

- [ ] Remove the shared student password fallback; use unique, one-time credentials or an invitation/reset flow.
- [ ] Enforce same-college ownership checks for every related entity ID on create/update/import paths; add cross-tenant authorization tests.
- [ ] Replace process-local authentication rate limits with a shared store or a verified edge/proxy limit.
- [ ] Disable fabricated student dashboard records for real accounts.
- [ ] Fix college deletion/audit transaction behavior and test the failure path.
- [ ] Deploy versioned database migrations and verify them against a production-like database.
- [ ] Verify `DATABASE_URL`, a strong random `SESSION_SECRET`, canonical `APP_URL`, and tested email sender/provider configuration in the production secret manager; do not place secrets in `NEXT_PUBLIC_*`.
- [ ] Verify backup retention/PITR and successfully restore a backup in the target environment.
- [ ] Confirm database TLS, connection capacity/pooling, monitoring/alerts, audit retention, privacy requirements, and recovery targets with the deployment provider.
- [ ] Add CI/release gates and run authenticated role-based smoke/E2E checks for admin, faculty, and student workflows on the exact release commit.
- [ ] Resolve the accessibility findings and confirm indexing policy for public versus authenticated pages.
