import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { courseEnrollments, courseOfferings, students } from "@/db/schema";
import { created, notFound, ok, paginationMeta, parsePagination, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { isFacultyScoped } from "@/lib/permissions";
import { writeAudit } from "@/lib/audit";
import { enrollmentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(user);
    const url = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(url.searchParams);
    const where = and(
      eq(courseOfferings.collegeId, collegeId),
      isFacultyScoped(user) ? eq(courseOfferings.facultyUserId, user.id) : undefined,
    );
    const [rows, counted] = await Promise.all([
      db
        .select({
          id: courseEnrollments.id,
          status: courseEnrollments.status,
          studentId: courseEnrollments.studentId,
          offeringId: courseEnrollments.offeringId,
        })
        .from(courseEnrollments)
        .innerJoin(courseOfferings, eq(courseOfferings.id, courseEnrollments.offeringId))
        .innerJoin(students, eq(students.id, courseEnrollments.studentId))
        .where(and(where, eq(students.collegeId, collegeId)))
        .orderBy(asc(courseEnrollments.id))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(courseEnrollments)
        .innerJoin(courseOfferings, eq(courseOfferings.id, courseEnrollments.offeringId))
        .innerJoin(students, eq(students.id, courseEnrollments.studentId))
        .where(and(where, eq(students.collegeId, collegeId))),
    ]);
    const total = counted?.[0]?.count ?? 0;
    return ok(rows, paginationMeta(total, { page, pageSize }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const parsed = enrollmentSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [offering] = await db
      .select()
      .from(courseOfferings)
      .where(and(eq(courseOfferings.id, parsed.data.offeringId), eq(courseOfferings.collegeId, collegeId)))
      .limit(1);
    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, parsed.data.studentId), eq(students.collegeId, collegeId)))
      .limit(1);
    if (!offering || !student) return notFound("Student or offering not found in your college.");

    const [row] = await db
      .insert(courseEnrollments)
      .values({ offeringId: offering.id, studentId: student.id, status: "enrolled" })
      .returning();
    await writeAudit({
      actor,
      action: "enrollment.create",
      targetType: "enrollment",
      targetId: row.id,
      collegeId,
    });
    return created(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("enrollments_offering_student_unique")) {
      return validationError("This student is already enrolled in the offering.");
    }
    return handleApiError(error);
  }
}
