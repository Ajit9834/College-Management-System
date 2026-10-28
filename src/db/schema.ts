import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const collegeStatusEnum = pgEnum("college_status", [
  "active",
  "pending",
  "rejected",
  "suspended",
  "inactive",
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "deactivated",
]);

export const roleNameEnum = pgEnum("role_name", [
  "platform_admin",
  "college_admin",
  "faculty",
  "accounts_staff",
  "student",
]);

export const studentStatusEnum = pgEnum("student_status", [
  "active",
  "inactive",
  "graduated",
  "withdrawn",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "enrolled",
  "withdrawn",
  "completed",
]);

export const offeringStatusEnum = pgEnum("offering_status", [
  "scheduled",
  "active",
  "completed",
  "cancelled",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "excused",
]);

export const publishStatusEnum = pgEnum("publish_status", [
  "draft",
  "published",
  "archived",
]);

export const feeStatusEnum = pgEnum("fee_status", [
  "pending",
  "paid",
  "partially_paid",
  "overdue",
  "cancelled",
]);

export const noticeAudienceEnum = pgEnum("notice_audience", [
  "all",
  "students",
  "staff",
]);

export const colleges = pgTable(
  "colleges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    code: varchar("code", { length: 32 }).notNull(),
    city: varchar("city", { length: 120 }),
    state: varchar("state", { length: 120 }),
    address: text("address"),
    phone: varchar("phone", { length: 40 }),
    email: varchar("email", { length: 255 }),
    website: varchar("website", { length: 255 }),
    contactName: varchar("contact_name", { length: 160 }),
    universityName: varchar("university_name", { length: 200 }),
    // New self-registered colleges start here until a platform admin approves them.
    status: collegeStatusEnum("status").notNull().default("active"),
    establishedYear: integer("established_year"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("colleges_code_unique").on(table.code),
    uniqueIndex("colleges_email_unique").on(table.email),
    index("colleges_status_idx").on(table.status),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    status: userStatusEnum("status").notNull().default("active"),
    sessionEpoch: integer("session_epoch").notNull().default(0),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_status_idx").on(table.status),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_hash_unique").on(table.tokenHash),
    index("password_reset_tokens_user_idx").on(table.userId),
  ],
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleNameEnum("role").notNull(),
    collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_roles_unique").on(table.userId, table.role, table.collegeId),
    index("user_roles_user_idx").on(table.userId),
    index("user_roles_college_idx").on(table.collegeId),
  ],
);

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    code: varchar("code", { length: 32 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("departments_college_code_unique").on(table.collegeId, table.code),
    index("departments_college_idx").on(table.collegeId),
  ],
);

export const programs = pgTable(
  "programs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    code: varchar("code", { length: 32 }).notNull(),
    durationSemesters: integer("duration_semesters").notNull().default(8),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("programs_college_code_unique").on(table.collegeId, table.code),
    index("programs_college_idx").on(table.collegeId),
  ],
);

export const students = pgTable(
  "students",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "restrict" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    registrationNo: varchar("registration_no", { length: 40 }).notNull(),
    currentSemester: integer("current_semester").notNull().default(1),
    academicYear: varchar("academic_year", { length: 16 }).notNull().default("2025-2026"),
    dateOfBirth: date("date_of_birth"),
    gender: varchar("gender", { length: 24 }),
    address: text("address"),
    emergencyContact: varchar("emergency_contact", { length: 160 }),
    photoId: uuid("photo_id").references(() => fileUploads.id, { onDelete: "set null" }),
    status: studentStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("students_college_reg_unique").on(table.collegeId, table.registrationNo),
    uniqueIndex("students_user_unique").on(table.userId),
    index("students_college_idx").on(table.collegeId),
    index("students_status_idx").on(table.status),
  ],
);

export const facultyProfiles = pgTable(
  "faculty_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    employeeNo: varchar("employee_no", { length: 40 }).notNull(),
    title: varchar("title", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("faculty_user_unique").on(table.userId),
    uniqueIndex("faculty_college_emp_unique").on(table.collegeId, table.employeeNo),
  ],
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 32 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    credits: integer("credits").notNull().default(3),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("courses_college_code_unique").on(table.collegeId, table.code),
    index("courses_college_idx").on(table.collegeId),
  ],
);

export const courseOfferings = pgTable(
  "course_offerings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    academicYear: varchar("academic_year", { length: 16 }).notNull(),
    semester: integer("semester").notNull(),
    facultyUserId: uuid("faculty_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: offeringStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("offerings_unique").on(
      table.courseId,
      table.academicYear,
      table.semester,
    ),
    index("offerings_college_idx").on(table.collegeId),
  ],
);

export const courseEnrollments = pgTable(
  "course_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => courseOfferings.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    status: enrollmentStatusEnum("status").notNull().default("enrolled"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("enrollments_offering_student_unique").on(
      table.offeringId,
      table.studentId,
    ),
    index("enrollments_student_idx").on(table.studentId),
  ],
);

export const timetableEntries = pgTable(
  "timetable_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => courseOfferings.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    startsAt: varchar("starts_at", { length: 5 }).notNull(),
    endsAt: varchar("ends_at", { length: 5 }).notNull(),
    room: varchar("room", { length: 40 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("timetable_offering_idx").on(table.offeringId),
    index("timetable_college_idx").on(table.collegeId),
  ],
);

export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => courseOfferings.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    sessionDate: date("session_date").notNull(),
    topic: varchar("topic", { length: 200 }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("attendance_session_unique").on(table.offeringId, table.sessionDate),
    index("attendance_sessions_college_idx").on(table.collegeId),
  ],
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status").notNull(),
    markedBy: uuid("marked_by").references(() => users.id, { onDelete: "set null" }),
    notes: varchar("notes", { length: 240 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("attendance_record_unique").on(table.sessionId, table.studentId),
    index("attendance_records_student_idx").on(table.studentId),
  ],
);

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => courseOfferings.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    maxMarks: integer("max_marks").notNull().default(100),
    publishStatus: publishStatusEnum("publish_status").notNull().default("draft"),
    examDate: date("exam_date"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("assessments_college_idx").on(table.collegeId),
    index("assessments_offering_idx").on(table.offeringId),
  ],
);

export const results = pgTable(
  "results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    marks: numeric("marks", { precision: 6, scale: 2 }).notNull(),
    grade: varchar("grade", { length: 8 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("results_assessment_student_unique").on(
      table.assessmentId,
      table.studentId,
    ),
    index("results_student_idx").on(table.studentId),
  ],
);

export const feeInvoices = pgTable(
  "fee_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    dueDate: date("due_date").notNull(),
    status: feeStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("fee_invoices_student_idx").on(table.studentId),
    index("fee_invoices_college_idx").on(table.collegeId),
    index("fee_invoices_status_idx").on(table.status),
  ],
);

export const feeTransactions = pgTable(
  "fee_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => feeInvoices.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
    reference: varchar("reference", { length: 80 }),
    status: feeStatusEnum("status").notNull().default("paid"),
    recordedBy: uuid("recorded_by").references(() => users.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("fee_tx_invoice_idx").on(table.invoiceId)],
);

export const notices = pgTable(
  "notices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    audience: noticeAudienceEnum("audience").notNull().default("all"),
    attachmentId: uuid("attachment_id").references(() => fileUploads.id, {
      onDelete: "set null",
    }),
    publishStatus: publishStatusEnum("publish_status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notices_college_idx").on(table.collegeId),
    index("notices_status_idx").on(table.publishStatus),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 80 }).notNull(),
    targetType: varchar("target_type", { length: 80 }).notNull(),
    targetId: varchar("target_id", { length: 80 }),
    collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorUserId),
    index("audit_logs_created_idx").on(table.createdAt),
    index("audit_logs_college_idx").on(table.collegeId),
  ],
);

export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 80 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fileUploads = pgTable(
  "file_uploads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("file_uploads_college_idx").on(table.collegeId),
    index("file_uploads_created_idx").on(table.createdAt),
  ],
);

export const schema = {
  colleges,
  users,
  passwordResetTokens,
  userRoles,
  departments,
  programs,
  students,
  facultyProfiles,
  courses,
  courseOfferings,
  courseEnrollments,
  timetableEntries,
  attendanceSessions,
  attendanceRecords,
  assessments,
  results,
  feeInvoices,
  feeTransactions,
  notices,
  fileUploads,
  auditLogs,
  platformSettings,
};

export type RoleName =
  | "platform_admin"
  | "college_admin"
  | "faculty"
  | "accounts_staff"
  | "student";
