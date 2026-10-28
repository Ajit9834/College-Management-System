import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords, attendanceSessions } from "@/db/schema";
import { notFound, ok } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";

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
      .select()
      .from(attendanceSessions)
      .where(and(eq(attendanceSessions.id, id), eq(attendanceSessions.collegeId, collegeId)))
      .limit(1);
    if (!session) return notFound("Attendance session not found.");

    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.id, recordId), eq(attendanceRecords.sessionId, session.id)))
      .limit(1);
    if (!record) return notFound("Attendance record not found.");

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
