import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  attendanceRecords,
  attendanceSessions,
  courseEnrollments,
  courseOfferings,
  students,
} from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { canAccessOffering, isFacultyScoped } from "@/lib/permissions";
import { attendanceRecordsSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = attendanceRecordsSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

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

    if (isFacultyScoped(actor)) {
      const studentIds = [...new Set(parsed.data.records.map((record) => record.studentId))];
      const enrolled = studentIds.length
        ? await db
            .select({ studentId: courseEnrollments.studentId })
            .from(courseEnrollments)
            .innerJoin(students, eq(students.id, courseEnrollments.studentId))
            .where(
              and(
                eq(courseEnrollments.offeringId, session.offeringId),
                eq(students.collegeId, collegeId),
                inArray(courseEnrollments.studentId, studentIds),
              ),
            )
        : [];
      const enrolledStudentIds = new Set(enrolled.map((row) => row.studentId));
      if (studentIds.some((studentId) => !enrolledStudentIds.has(studentId))) {
        return validationError("Attendance can only be recorded for students enrolled in this offering.");
      }
    }

    await db.transaction(async (tx) => {
      for (const record of parsed.data.records) {
        const [student] = await tx
          .select()
          .from(students)
          .where(and(eq(students.id, record.studentId), eq(students.collegeId, collegeId)))
          .limit(1);
        if (!student) continue;
        await tx
          .insert(attendanceRecords)
          .values({
            sessionId: session.id,
            studentId: student.id,
            status: record.status,
            notes: record.notes ?? null,
            markedBy: actor.id,
          })
          .onConflictDoUpdate({
            target: [attendanceRecords.sessionId, attendanceRecords.studentId],
            set: {
              status: record.status,
              notes: record.notes ?? null,
              markedBy: actor.id,
              updatedAt: new Date(),
            },
          });
      }
    });

    await writeAudit({
      actor,
      action: "attendance.records.upsert",
      targetType: "attendance_session",
      targetId: session.id,
      collegeId,
      metadata: { count: parsed.data.records.length },
    });
    return ok({ saved: parsed.data.records.length });
  } catch (error) {
    return handleApiError(error);
  }
}
