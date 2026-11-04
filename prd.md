# EduSphere College Management System

## Product requirements document

| Field | Details |
| --- | --- |
| Product | EduSphere College Management System |
| Status | Describes the current repository implementation |
| Audience | Product, design, engineering, QA, and institutional stakeholders |
| Last updated | 2026-11-04 |
| Technical architecture | [architecture.md](./architecture.md) |

## 1. Product summary

EduSphere is a role-based, multi-college web application for managing student academic information and common institutional operations. It provides separate experiences for platform administrators, college staff, faculty, and students, with college-scoped access to institutional records.

The current product is a working prototype built as a single Next.js application. It covers account access, college onboarding and approvals, academic setup, attendance, assessments and results, fee records, notices, student self-service, and administrative reporting.

## 2. Problem and opportunity

Colleges need a shared place to maintain academic and operational information, while students need a dependable way to view their own records. Separate spreadsheets and disconnected processes make it harder to keep enrollment, attendance, assessment, fee, and communication data aligned. A multi-tenant system can centralize these workflows while limiting each user to the information their role and college permit.

## 3. Product goals

1. Provide distinct, understandable portals for students, college users, and platform administrators.
2. Keep core academic records and operational workflows in one relational system.
3. Enforce role permissions and college boundaries on the server, not just in the interface.
4. Let students view their own academic, attendance, timetable, notice, and fee information.
5. Give authorized college users tools to manage academic operations and student records.
6. Give platform administrators oversight of college onboarding, users, audit activity, and platform settings.

### Out of scope for the current implementation

- Processing payments through a payment gateway; fee transactions are recorded and tracked in the application.
- Native mobile applications or independently deployed frontend and backend services.
- A general-purpose learning management system, including course content delivery and online classes.
- Automated integrations with external student-information, accounting, or government systems.
- Production service-level objectives, capacity guarantees, or compliance certifications.

## 4. Users and permissions

| User | Primary needs | Current access |
| --- | --- | --- |
| Platform administrator | Approve and oversee colleges, manage users, inspect audit activity, and configure platform settings. | Platform-wide administration. |
| College administrator | Manage college structure, students, courses, offerings, timetable, attendance, results, fees, notices, reports, and settings. | Assigned college; may publish results and manage student records. |
| Faculty | Work with assigned offerings and academic activities. | College-scoped access; faculty-only access is limited to the offerings they teach and related enrolled students where enforced by the workflow. |
| Accounts staff | Manage fee records and view permitted student information. | Assigned college; fee management. |
| Student | Review their profile and academic progress. | Their own records only. |

Accounts may be active, suspended, or deactivated. College registrations can be pending, active, rejected, suspended, or inactive. A self-registered college remains blocked from college-portal operations until approved.

## 5. Product requirements

### 5.1 Access, registration, and account security

- Provide sign-in entry points for the student, college, and administrator portals.
- Authenticate users with server-managed sessions and route them to the portal appropriate to their assigned role.
- Support registration entry points, college registration and approval, password changes, password reset requests, and password reset completion.
- Provide optional Google sign-in through Supabase OAuth when configured. Google sign-in must not create application roles or grant access by itself.
- Reject inactive or suspended accounts from protected workflows.
- Use expiring, single-use password-reset tokens.

### 5.2 Platform administration

- Show a platform overview and administrative reports.
- List, inspect, and manage colleges and their approval state.
- List and manage users and assigned privileges.
- Create, edit, publish, archive, and delete platform-wide notices for students, staff, or all users across colleges.
- Review audit log entries and individual audit records.
- Manage platform settings and export supported reports.

### 5.3 College operations

- Maintain departments, programs, courses, and academic course offerings.
- Manage student records, enrollment, and supported student imports.
- Assign faculty to course offerings and manage timetable entries.
- Create attendance sessions and record attendance for enrolled students.
- Create assessments, enter marks, and publish results through authorized roles.
- Create fee invoices, record payments, view fee status, and provide supported receipts.
- Draft and publish notices for the configured audience.
- View college reports and update college settings.
- Upload and retrieve supported files subject to authorization.

### 5.4 Student self-service

- Show a student dashboard and profile.
- Allow students to review their courses and timetable.
- Show attendance records and summaries.
- Show published assessment results and supported report-card or transcript information.
- Show fee invoices, payment status, and available receipts.
- Show notices intended for the student audience.
- Include published platform-wide notices alongside published notices from the student's own college; never show drafts, archived notices, or notices targeted only to staff.
- Do not expose another student's private record through student routes.

### 5.5 Shared experience

- Use responsive portal layouts with navigation appropriate to the user's portal.
- Provide clear loading, empty, validation, authorization, and error states for workflows.
- Keep successful API responses and validation/error responses in the documented response envelope.
- Preserve access-denied and pending-approval feedback rather than presenting blocked actions as successful.

## 6. Core user journeys

1. **College onboarding:** A college representative registers; the college remains pending; a platform administrator reviews and approves or rejects it; approved college users can then use college operations.
2. **Staff academic setup:** An authorized college user establishes departments and programs, creates courses and offerings, assigns faculty, and prepares timetable entries.
3. **Student academic progress:** A student signs in and views their profile, courses, timetable, attendance, published results, notices, and fee records.
4. **Attendance:** Authorized faculty or college administrators create an attendance session for an offering and record student attendance; students can view their own attendance.
5. **Assessment and results:** Authorized staff create an assessment and enter marks; a college administrator publishes results; students can then view published results.
6. **Fee tracking:** Accounts staff or college administrators create invoices and record transactions; students can view their invoice status and available receipts.
7. **Platform oversight:** A platform administrator reviews colleges, users, audit activity, and platform-level reports/settings.
8. **Account recovery:** A user requests a password reset; an expiring single-use link is sent when email delivery is configured; the user sets a replacement password.

## 7. Data and business rules

- Every college-managed record belongs to a college either directly or through its related academic records.
- Students are associated with one user account, college, department, and program; registration numbers are unique within a college.
- Course offerings identify a course, academic year, semester, college, and optionally an assigned faculty member.
- Students may be enrolled in offerings. The current data helper can automatically enroll active students in active offerings matching their college, department, semester, and academic year.
- Attendance is recorded per student and attendance session; the supported statuses are present, absent, late, and excused.
- Assessment results are unique per assessment and student. Draft or unpublished results are not intended for student visibility.
- Fee invoices and transactions track amounts and status; this is record keeping, not payment processing.
- Notices may be college-specific or platform-wide and may target all users, students, or staff; publication status controls visibility.
- Sensitive administrative actions are represented in audit records.

## 8. Security, privacy, and access requirements

- Enforce authentication and authorization on server-rendered protected pages and API operations.
- Enforce role checks and college scope on protected backend requests.
- Restrict students to their own records and college users to assigned college data.
- Restrict result publication and student-record management to college administrators.
- Do not permit a pending or rejected college to use protected college operations.
- Validate request bodies and parameters at API boundaries.
- Do not include secrets in client-side configuration; only the Supabase URL and public anon key are used by the browser OAuth flow.
- Keep reset tokens single-use and expiring; session cookies are HTTP-only and use secure transport in production.
- Treat student, attendance, assessment, and fee data as sensitive institutional information.

## 9. Non-functional requirements

- **Usability:** Portals should make role and current context clear, and support desktop and mobile-width layouts.
- **Consistency:** Use shared interface components, validation, API response envelopes, and centralized permission helpers.
- **Data integrity:** Use relational constraints and unique indexes to protect key relationships and prevent duplicate records.
- **Maintainability:** Keep page and route entry points in Next.js conventions, with shared server-side logic and database schema centralized under `src/backend`.
- **Testability:** Permission rules and other critical business logic should have focused automated checks.
- **Availability and scale:** No production availability or throughput target is currently specified. Production readiness must define these targets and evaluate database hosting, backups, rate limiting, and operational monitoring.

## 10. Acceptance criteria

- Users with valid roles are directed to the correct portal; unauthenticated users cannot access protected operations.
- Users cannot read or modify records outside their role and college scope.
- Student routes only return the signed-in student's own data.
- Pending or rejected college users cannot access protected college-portal operations.
- Faculty cannot publish results; a college administrator can.
- Students can see their academic and financial records only through student-facing read workflows and only as permitted by publication/status rules.
- Invalid API input returns a validation error, and successful API responses use the standard `{ data, meta }` envelope.
- Supported exports, receipts, and uploads honor the same access-control boundaries as their source records.
- Automated permission tests, linting, and TypeScript checks pass before release.

## 11. Success measures

The repository does not currently define production analytics or service targets. For a production rollout, select measurable baselines such as:

- College onboarding completion and approval time.
- Percentage of active students with complete profiles and current enrollments.
- Attendance and assessment workflows completed through the system.
- Student portal usage and successful access to published records.
- Unauthorized-access and cross-college access tests passing.
- Error rates and response times for high-use student and staff workflows.

These are recommended measures, not currently instrumented product guarantees.

## 12. Assumptions and open decisions

- Each participating college is represented as a tenant within the shared application and database.
- Institutional administrators remain responsible for the accuracy of operational records.
- Email delivery and Google OAuth are optional integrations and require environment configuration.
- Payment recording is manual/application-managed until a payment-provider integration is explicitly selected.
- Production deployment, retention, privacy/compliance requirements, backup policy, and target scale remain deployment decisions.

## 13. Related documentation

- System structure, request flow, data model, configuration, and operational constraints: [architecture.md](./architecture.md).
- Local setup and scripts: [README.md](./README.md).
