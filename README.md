# CampusFlow — College Management System

Role-based college platform for **students**, **college staff**, and **platform admins**. Built with Next.js (App Router), TypeScript, Tailwind CSS, Drizzle ORM, and PostgreSQL.

## Features

- Secure session sign-in with hashed passwords and rate-limited login
- Self-service password reset with single-use, hashed, 30-minute tokens
- Three portals with server-enforced authorization and college/student scoping
- Students, departments, programs, courses, offerings, enrollments, timetable
- Attendance sessions/records, assessments/results (publish-gated), fee invoices
- Notices, audit logs, and platform settings
- College self-service profile (address, phone, email, website, city, state)
- Search, validation, confirmation for high-impact actions, and responsive UI

## Local setup

1. Copy environment variables:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string. Special characters in the password must be URL-encoded. |
| `SESSION_SECRET` | yes | HMAC key for signing session cookies. Use a long random value. |
| `RESEND_API_KEY` | no | Resend API key for password reset emails. Without it, reset links are logged to the server console in development. |
| `MAIL_FROM` | no | Sender address for reset emails. Defaults to `CampusFlow <no-reply@campusflow.edu>`. |
| `APP_URL` | no | Public base URL used to build reset links. Falls back to the incoming request origin. |

2. Create the PostgreSQL database (default in this sandbox: `app_db`).

3. Install dependencies and apply the schema:

```bash
npm install
npx drizzle-kit push
```

Demo data is seeded automatically on first app load when the `users` table is empty.

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Platform admin | `admin@campusflow.edu` | `CampusAdmin!23` |
| College admin (Riverside) | `clare.admin@riverside.edu` | `CollegeAdmin!23` |
| Faculty | `ravi.faculty@riverside.edu` | `FacultyPass!23` |
| Accounts staff | `nina.accounts@riverside.edu` | `AccountsPass!23` |
| Student | `arjun.student@riverside.edu` | `StudentPass!23` |
| Harbor college admin | `priya.admin@harborarts.edu` | `CollegeAdmin!23` |
| Harbor student | `lina.student@harborarts.edu` | `StudentPass!23` |

Harbor accounts exist so college-scoped authorization can be verified (Riverside staff cannot read Harbor records).

## Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run start        # production server
npm run lint         # ESLint
npm run typecheck    # TypeScript
```

## API

Base path: `/api/v1`

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET  /api/v1/auth/me`
- Admin: `/api/v1/admin/colleges`, `/users`, `/audit-logs`, `/settings`
- College: `/api/v1/college/students`, `/courses`, `/attendance/sessions`, `/assessments`, `/fees`, `/notices`, `/settings`
- Student: `/api/v1/student/me`, `/courses`, `/timetable`, `/attendance`, `/results`, `/fees`
- `GET /api/v1/notices`

Errors use `{ error: { code, message, details? } }`. Success uses `{ data, meta }`.

## Authorization rules

- Students can only read their own academic, attendance, result, and fee records.
- College staff can only access records for their assigned college.
- Only college admins can publish results and manage student records.
- Only platform admins can create colleges and assign privileged roles.
- Suspended users cannot use protected routes.

## Tests

Permission helpers live in `src/lib/permissions.ts`. Run:

```bash
node --experimental-strip-types --test src/lib/permissions.test.ts
```
