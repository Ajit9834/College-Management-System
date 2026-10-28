import { and, desc, eq, gt, gte, ilike, inArray, lt, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assessments,
  attendanceRecords,
  attendanceSessions,
  auditLogs,
  colleges,
  courseEnrollments,
  courseOfferings,
  courses,
  departments,
  facultyProfiles,
  feeInvoices,
  feeTransactions,
  fileUploads,
  notices,
  platformSettings,
  programs,
  results,
  students,
  timetableEntries,
  userRoles,
  users,
} from "@/db/schema";
import type { AuthUser } from "@/lib/permissions";
import { hasRole, primaryCollegeId } from "@/lib/permissions";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export async function getStudentByUserId(userId: string) {
  const [row] = await db
    .select({
      student: students,
      programName: programs.name,
      programCode: programs.code,
      departmentName: departments.name,
      collegeName: colleges.name,
      collegeCode: colleges.code,
      userEmail: users.email,
      userName: users.fullName,
      userPhone: users.phone,
    })
    .from(students)
    .innerJoin(programs, eq(programs.id, students.programId))
    .innerJoin(departments, eq(departments.id, students.departmentId))
    .innerJoin(colleges, eq(colleges.id, students.collegeId))
    .innerJoin(users, eq(users.id, students.userId))
    .where(eq(students.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getStudentById(id: string) {
  const [row] = await db
    .select({
      student: students,
      programName: programs.name,
      programCode: programs.code,
      departmentName: departments.name,
      collegeName: colleges.name,
      collegeCode: colleges.code,
      userEmail: users.email,
      userName: users.fullName,
      userPhone: users.phone,
    })
    .from(students)
    .innerJoin(programs, eq(programs.id, students.programId))
    .innerJoin(departments, eq(departments.id, students.departmentId))
    .innerJoin(colleges, eq(colleges.id, students.collegeId))
    .innerJoin(users, eq(users.id, students.userId))
    .where(eq(students.id, id))
    .limit(1);
  return row ?? null;
}

export async function listStudentCourses(studentId: string) {
  return db
    .select({
      enrollmentId: courseEnrollments.id,
      status: courseEnrollments.status,
      offeringId: courseOfferings.id,
      academicYear: courseOfferings.academicYear,
      semester: courseOfferings.semester,
      courseCode: courses.code,
      courseTitle: courses.title,
      credits: courses.credits,
      facultyName: users.fullName,
    })
    .from(courseEnrollments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseEnrollments.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(users, eq(users.id, courseOfferings.facultyUserId))
    .where(eq(courseEnrollments.studentId, studentId))
    .orderBy(courses.code);
}

export async function listStudentTimetable(studentId: string) {
  return db
    .select({
      id: timetableEntries.id,
      weekday: timetableEntries.weekday,
      startsAt: timetableEntries.startsAt,
      endsAt: timetableEntries.endsAt,
      room: timetableEntries.room,
      courseCode: courses.code,
      courseTitle: courses.title,
      facultyName: users.fullName,
    })
    .from(courseEnrollments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseEnrollments.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(timetableEntries, eq(timetableEntries.offeringId, courseOfferings.id))
    .leftJoin(users, eq(users.id, courseOfferings.facultyUserId))
    .where(
      and(
        eq(courseEnrollments.studentId, studentId),
        eq(courseEnrollments.status, "enrolled"),
      ),
    )
    .orderBy(timetableEntries.weekday, timetableEntries.startsAt);
}

export async function listStudentAttendance(studentId: string) {
  const rows = await db
    .select({
      id: attendanceRecords.id,
      status: attendanceRecords.status,
      sessionDate: attendanceSessions.sessionDate,
      topic: attendanceSessions.topic,
      courseCode: courses.code,
      courseTitle: courses.title,
      offeringId: courseOfferings.id,
    })
    .from(attendanceRecords)
    .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.sessionId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, attendanceSessions.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(attendanceRecords.studentId, studentId))
    .orderBy(desc(attendanceSessions.sessionDate));

  const byCourse = new Map<
    string,
    { courseCode: string; courseTitle: string; present: number; total: number }
  >();
  for (const row of rows) {
    const current = byCourse.get(row.offeringId) ?? {
      courseCode: row.courseCode,
      courseTitle: row.courseTitle,
      present: 0,
      total: 0,
    };
    current.total += 1;
    if (row.status === "present" || row.status === "late" || row.status === "excused") {
      current.present += 1;
    }
    byCourse.set(row.offeringId, current);
  }
  return { records: rows, summary: [...byCourse.values()] };
}

export async function listStudentResults(studentId: string) {
  return db
    .select({
      id: results.id,
      marks: results.marks,
      grade: results.grade,
      publishedAt: results.publishedAt,
      title: assessments.title,
      maxMarks: assessments.maxMarks,
      examDate: assessments.examDate,
      courseCode: courses.code,
      courseTitle: courses.title,
    })
    .from(results)
    .innerJoin(assessments, eq(assessments.id, results.assessmentId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, assessments.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(
      and(eq(results.studentId, studentId), eq(assessments.publishStatus, "published")),
    )
    .orderBy(desc(assessments.examDate));
}

export async function listStudentFees(studentId: string) {
  const invoices = await db
    .select()
    .from(feeInvoices)
    .where(eq(feeInvoices.studentId, studentId))
    .orderBy(desc(feeInvoices.dueDate));
  const txs =
    invoices.length === 0
      ? []
      : await db
          .select()
          .from(feeTransactions)
          .where(
            inArray(
              feeTransactions.invoiceId,
              invoices.map((i) => i.id),
            ),
          );
  return { invoices, transactions: txs };
}

export async function listNoticesForUser(user: AuthUser) {
  const collegeId = primaryCollegeId(user);
  const audienceFilter = hasRole(user, ["student"])
    ? or(eq(notices.audience, "all"), eq(notices.audience, "students"))
    : or(eq(notices.audience, "all"), eq(notices.audience, "staff"));

  return db
    .select()
    .from(notices)
    .where(
      and(
        eq(notices.publishStatus, "published"),
        audienceFilter,
        collegeId
          ? or(eq(notices.collegeId, collegeId), sql`${notices.collegeId} is null`)
          : sql`${notices.collegeId} is null`,
      ),
    )
    .orderBy(desc(notices.publishedAt));
}

export async function listUploadNames(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const rows = await db
    .select({ id: fileUploads.id, fileName: fileUploads.fileName })
    .from(fileUploads)
    .where(inArray(fileUploads.id, unique));
  return Object.fromEntries(rows.map((row) => [row.id, row.fileName]));
}

export async function syncOverdueInvoices(collegeId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const updated = await db
    .update(feeInvoices)
    .set({ status: "overdue", updatedAt: new Date() })
    .where(
      and(
        eq(feeInvoices.collegeId, collegeId),
        inArray(feeInvoices.status, ["pending", "partially_paid"]),
        lt(feeInvoices.dueDate, today),
      ),
    )
    .returning({ id: feeInvoices.id });
  return updated.length;
}

export async function collegeDashboardStats(collegeId: string) {
  await syncOverdueInvoices(collegeId);
  const [studentCount] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(students)
    .where(and(eq(students.collegeId, collegeId), eq(students.status, "active")));
  const [staffCount] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.collegeId, collegeId),
        inArray(userRoles.role, ["college_admin", "faculty", "accounts_staff"]),
      ),
    );
  const [offeringCount] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(courseOfferings)
    .where(and(eq(courseOfferings.collegeId, collegeId), eq(courseOfferings.status, "active")));
  const [present] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(attendanceRecords)
    .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.sessionId))
    .where(
      and(
        eq(attendanceSessions.collegeId, collegeId),
        inArray(attendanceRecords.status, ["present", "late", "excused"]),
      ),
    );
  const [totalAtt] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(attendanceRecords)
    .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.sessionId))
    .where(eq(attendanceSessions.collegeId, collegeId));
  const [overdueFees] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(feeInvoices)
    .where(and(eq(feeInvoices.collegeId, collegeId), eq(feeInvoices.status, "overdue")));
  const [draftResults] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(assessments)
    .where(and(eq(assessments.collegeId, collegeId), eq(assessments.publishStatus, "draft")));

  return {
    students: studentCount?.value ?? 0,
    staff: staffCount?.value ?? 0,
    offerings: offeringCount?.value ?? 0,
    attendancePct: totalAtt?.value
      ? Math.round(((present?.value ?? 0) / totalAtt.value) * 100)
      : 0,
    overdueFees: overdueFees?.value ?? 0,
    unpublishedResults: draftResults?.value ?? 0,
  };
}

export async function adminDashboardStats() {
  const [collegeCount] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(colleges);
  const [userCount] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.status, "active"));
  const [studentCount] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(students)
    .where(eq(students.status, "active"));
  const [suspended] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.status, "suspended"));
  const recentAudit = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      createdAt: auditLogs.createdAt,
      actorName: users.fullName,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(8);
  const collegeRows = await db.select().from(colleges).orderBy(colleges.name);
  const pendingColleges = await db
    .select()
    .from(colleges)
    .where(eq(colleges.status, "pending"))
    .orderBy(desc(colleges.createdAt));
  return {
    colleges: collegeCount?.value ?? 0,
    users: userCount?.value ?? 0,
    students: studentCount?.value ?? 0,
    suspended: suspended?.value ?? 0,
    pendingColleges,
    recentAudit,
    collegeRows,
  };
}

const collegeStudentColumns = {
  id: students.id,
  registrationNo: students.registrationNo,
  currentSemester: students.currentSemester,
  status: students.status,
  academicYear: students.academicYear,
  fullName: users.fullName,
  email: users.email,
  phone: users.phone,
  programName: programs.name,
  departmentName: departments.name,
};

function collegeStudentConditions(collegeId: string, q?: string, facultyUserId?: string) {
  const conditions = [eq(students.collegeId, collegeId)];

  if (facultyUserId) {
    conditions.push(
      inArray(
        students.id,
        db
          .select({ id: courseEnrollments.studentId })
          .from(courseEnrollments)
          .innerJoin(courseOfferings, eq(courseOfferings.id, courseEnrollments.offeringId))
          .where(eq(courseOfferings.facultyUserId, facultyUserId)),
      ),
    );
  }

  if (q) {
    conditions.push(
      or(
        ilike(users.fullName, `%${q}%`),
        ilike(students.registrationNo, `%${q}%`),
        ilike(users.email, `%${q}%`),
      )!,
    );
  }

  return conditions;
}

export async function listCollegeStudents(collegeId: string, q?: string, facultyUserId?: string) {
  return db
    .select(collegeStudentColumns)
    .from(students)
    .innerJoin(users, eq(users.id, students.userId))
    .innerJoin(programs, eq(programs.id, students.programId))
    .innerJoin(departments, eq(departments.id, students.departmentId))
    .where(and(...collegeStudentConditions(collegeId, q, facultyUserId)))
    .orderBy(users.fullName);
}

export async function pageCollegeStudents(
  collegeId: string,
  options: { q?: string; facultyUserId?: string; limit?: number; offset?: number } = {},
): Promise<{ rows: Awaited<ReturnType<typeof listCollegeStudents>>; total: number }> {
  const { q, facultyUserId, limit = DEFAULT_PAGE_SIZE, offset = 0 } = options;
  const where = and(...collegeStudentConditions(collegeId, q, facultyUserId));
  const [rows, counted] = await Promise.all([
    db
      .select(collegeStudentColumns)
      .from(students)
      .innerJoin(users, eq(users.id, students.userId))
      .innerJoin(programs, eq(programs.id, students.programId))
      .innerJoin(departments, eq(departments.id, students.departmentId))
      .where(where)
      .orderBy(users.fullName)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .innerJoin(users, eq(users.id, students.userId))
      .innerJoin(programs, eq(programs.id, students.programId))
      .innerJoin(departments, eq(departments.id, students.departmentId))
      .where(where),
  ]);
  return { rows, total: counted?.[0]?.count ?? 0 };
}

export async function getSettingsMap() {
  const rows = await db.select().from(platformSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
}

export async function listFaculty(collegeId: string) {
  return db
    .select({
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      employeeNo: facultyProfiles.employeeNo,
      title: facultyProfiles.title,
    })
    .from(userRoles)
    .innerJoin(users, eq(users.id, userRoles.userId))
    .leftJoin(facultyProfiles, eq(facultyProfiles.userId, users.id))
    .where(and(eq(userRoles.collegeId, collegeId), eq(userRoles.role, "faculty")));
}

/** Offering ids taught by a given faculty member. */
export async function listFacultyOfferingIds(facultyUserId: string) {
  const rows = await db
    .select({ id: courseOfferings.id })
    .from(courseOfferings)
    .where(eq(courseOfferings.facultyUserId, facultyUserId));
  return rows.map((row) => row.id);
}

/** Whether a student is enrolled in any offering taught by the faculty member. */
export async function isStudentTaughtByFaculty(studentId: string, facultyUserId: string) {
  const [row] = await db
    .select({ id: courseEnrollments.id })
    .from(courseEnrollments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseEnrollments.offeringId))
    .where(
      and(
        eq(courseEnrollments.studentId, studentId),
        eq(courseOfferings.facultyUserId, facultyUserId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function getAttendanceSession(id: string) {
  const [row] = await db
    .select({
      id: attendanceSessions.id,
      offeringId: attendanceSessions.offeringId,
      collegeId: attendanceSessions.collegeId,
      sessionDate: attendanceSessions.sessionDate,
      topic: attendanceSessions.topic,
      courseCode: courses.code,
      courseTitle: courses.title,
    })
    .from(attendanceSessions)
    .innerJoin(courseOfferings, eq(courseOfferings.id, attendanceSessions.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(attendanceSessions.id, id))
    .limit(1);
  return row ?? null;
}

export type TimetableConflictInput = {
  collegeId: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  room?: string | null;
  offeringId: string;
  excludeId?: string;
};

/** Returns a human-readable conflict message, or null when the slot is free. */
export async function findTimetableConflict(input: TimetableConflictInput) {
  const [offering] = await db
    .select({ facultyUserId: courseOfferings.facultyUserId })
    .from(courseOfferings)
    .where(eq(courseOfferings.id, input.offeringId))
    .limit(1);

  const overlap = and(
    eq(timetableEntries.collegeId, input.collegeId),
    eq(timetableEntries.weekday, input.weekday),
    lt(timetableEntries.startsAt, input.endsAt),
    gt(timetableEntries.endsAt, input.startsAt),
    input.excludeId ? ne(timetableEntries.id, input.excludeId) : undefined,
  );

  if (input.room) {
    const [roomClash] = await db
      .select({ code: courses.code })
      .from(timetableEntries)
      .innerJoin(courseOfferings, eq(courseOfferings.id, timetableEntries.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .where(and(overlap, eq(timetableEntries.room, input.room)))
      .limit(1);
    if (roomClash) {
      return `Room ${input.room} is already booked for ${roomClash.code} in that time slot.`;
    }
  }

  const facultyUserId = offering?.facultyUserId ?? null;
  if (facultyUserId) {
    const [facultyClash] = await db
      .select({ code: courses.code })
      .from(timetableEntries)
      .innerJoin(courseOfferings, eq(courseOfferings.id, timetableEntries.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .where(and(overlap, eq(courseOfferings.facultyUserId, facultyUserId)))
      .limit(1);
    if (facultyClash) {
      return `The assigned faculty already has ${facultyClash.code} scheduled in that time slot.`;
    }
  }

  return null;
}

export type AuditFilters = {
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

function auditDateRange(from?: string, to?: string) {
  const fromRaw = from ? new Date(from) : null;
  const toRaw = to ? new Date(to) : null;
  const fromDate = fromRaw && !Number.isNaN(fromRaw.getTime()) ? fromRaw : null;
  // Include the whole "to" day.
  const toDate = toRaw && !Number.isNaN(toRaw.getTime())
    ? new Date(toRaw.setHours(23, 59, 59, 999))
    : null;
  return { fromDate, toDate };
}

export async function listAuditLogs(filters: AuditFilters = {}) {
  const { fromDate, toDate } = auditDateRange(filters.from, filters.to);
  const where = and(
    filters.action ? ilike(auditLogs.action, `%${filters.action}%`) : undefined,
    filters.actor
      ? or(ilike(users.fullName, `%${filters.actor}%`), ilike(users.email, `%${filters.actor}%`))
      : undefined,
    fromDate ? gte(auditLogs.createdAt, fromDate) : undefined,
    toDate ? lte(auditLogs.createdAt, toDate) : undefined,
  );

  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      collegeId: auditLogs.collegeId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: users.fullName,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(filters.limit ?? 100)
    .offset(filters.offset ?? 0);
}

export async function getAuditLogById(id: string) {
  const [row] = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      collegeId: auditLogs.collegeId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorUserId: auditLogs.actorUserId,
      actorName: users.fullName,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(eq(auditLogs.id, id))
    .limit(1);
  return row ?? null;
}
