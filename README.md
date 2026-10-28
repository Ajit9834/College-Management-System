# CampusFlow

CampusFlow is a role-based college management system built with Next.js, TypeScript, PostgreSQL, and Drizzle ORM. It gives each portal a clear responsibility: students can manage their academic life, college users handle operations, and platform administrators oversee the institution hierarchy.

## Overview

This application is designed for multi-college operations with strict data isolation. The platform supports:

- Student enrollment, academic records, and timetables
- Department, program, course, and offering management
- Attendance tracking and assessment workflows
- Fee management and invoice visibility
- Platform-wide notices and audit logging
- Secure authentication and authorization rules

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL
- Drizzle ORM
- Server-side session authentication

## Core features

- Secure login with session-based authentication
- Password reset flow with expiring, single-use tokens
- Role-based access control across admin, college, and student portals
- College-scoped data visibility and authorization checks
- Attendance sessions and record tracking
- Assessment entry, result publishing, and student report views
- Fee invoicing and payment tracking
- Notice publishing and settings management
- Audit logging for sensitive actions

## Project structure

```bash
.
├── src/
│   ├── app/               # Next.js pages and API route handlers
│   ├── frontend/
│   │   └── components/    # Reusable UI and portal components
│   └── backend/
│       ├── db/            # Database schema and seed logic
│       └── lib/           # Auth, permissions, validation, utilities
├── .env.example           # Example environment file
├── drizzle.config.ts      # Drizzle configuration
├── package.json           # Scripts and dependencies
├── next.config.ts         # Next.js app config
├── tsconfig.json          # TypeScript config
├── README.md              # Project documentation
└── .gitignore             # Default ignore rules
```

## Prerequisites

Before running the app locally, make sure you have:

- Node.js 20+
- PostgreSQL database
- npm

## Local setup

1. Create your environment file:

```bash
cp .env.example .env
```

2. Update the variables in `.env`:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret used to sign session cookies |
| `RESEND_API_KEY` | No | Used for password reset emails |
| `MAIL_FROM` | No | Sender address for outbound email |
| `APP_URL` | No | Public app URL used for reset links |

3. Create the PostgreSQL database if needed, then apply the schema:

```bash
npm install
npx drizzle-kit push
```

Demo data is seeded on first load when the user table is empty.

4. Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Demo accounts



## Available scripts

```bash
npm run dev        # Run the app in development mode
npm run build      # Create a production build
npm run start      # Start the production app
npm run lint       # Run ESLint checks
npm run typecheck  # Run TypeScript validation
```

## API overview

The API is organized under `/api/v1` and includes auth, admin, college, and student endpoints.

Examples:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`
- `GET /api/v1/notices`
- Admin routes under `/api/v1/admin/*`
- College routes under `/api/v1/college/*`
- Student routes under `/api/v1/student/*`

Response conventions:

- Errors return `{ error: { code, message, details? } }`
- Successful responses return `{ data, meta }`

## Authorization model

The platform enforces these rules:

- Students can only access their own records and academic information
- College staff can only work within their assigned college
- Only college admins can publish results and manage student records
- Only platform admins can create colleges and assign privileged roles
- Suspended users cannot access protected routes

## Testing

Permission logic is covered in the test file below:

```bash
node --experimental-strip-types --test src/backend/lib/permissions.test.ts
```

## Notes

The `frontend` and `backend` folders organize the UI components and server-side modules within the same Next.js application. Next.js requires page and API route entrypoints to remain under `src/app`, so this organization does not create independently deployable applications.

This project is a complete working college management prototype focused on data security, role-based access, and operational workflows. It is suitable for local development, demos, and further extension into a production-ready campus platform.
