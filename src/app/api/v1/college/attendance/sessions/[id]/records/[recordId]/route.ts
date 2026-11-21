import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  attendanceRecords,
  attendanceSessions,
  courseEnrollments,
  courseOfferings,
  students,
} from "@/db/schema";
import { notFound, ok } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { canAccessOffering, isFacultyScoped } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; recordId: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(actor);
    const { id, recordId } = await context.params;

    const [session] = await db
      .select({
        id: attendanceSessions.id,
        offeringId: attendanceSessions.offeringId,
        facultyUserId: courseOfferings.facultyUserId,
      })
      .from(attendanceSessions)
      .innerJoin(courseOfferings, eq(courseOfferings.id, attendanceSessions.offeringId))
      .where(
        and(
          eq(attendanceSessions.id, id),
          eq(attendanceSessions.collegeId, collegeId),
          eq(courseOfferings.collegeId, collegeId),
        ),
      )
      .limit(1);
    if (!session || !canAccessOffering(actor, session.facultyUserId)) {
      return notFound("Attendance session not found.");
    }

    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.id, recordId), eq(attendanceRecords.sessionId, session.id)))
      .limit(1);
    if (!record) return notFound("Attendance record not found.");
    if (isFacultyScoped(actor)) {
      const [enrollment] = await db
        .select({ studentId: courseEnrollments.studentId })
        .from(courseEnrollments)
        .innerJoin(students, eq(students.id, courseEnrollments.studentId))
        .where(
          and(
            eq(courseEnrollments.offeringId, session.offeringId),
            eq(courseEnrollments.studentId, record.studentId),
            eq(students.collegeId, collegeId),
          ),
        )
        .limit(1);
      if (!enrollment) return notFound("Attendance record not found.");
    }

    await db.delete(attendanceRecords).where(eq(attendanceRecords.id, record.id));

    await writeAudit({
      actor,
      action: "attendance.record.delete",
      targetType: "attendance_session",
      targetId: session.id,
      collegeId,
      metadata: { recordId: record.id, studentId: record.studentId, status: record.status },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
