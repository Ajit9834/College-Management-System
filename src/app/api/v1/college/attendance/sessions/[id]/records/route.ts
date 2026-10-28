import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords, attendanceSessions, students } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
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
      .select()
      .from(attendanceSessions)
      .where(and(eq(attendanceSessions.id, id), eq(attendanceSessions.collegeId, collegeId)))
      .limit(1);
    if (!session) return notFound("Attendance session not found.");

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
