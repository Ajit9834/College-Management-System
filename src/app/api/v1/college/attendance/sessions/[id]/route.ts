import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendanceSessions } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { attendanceSessionUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = attendanceSessionUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [existing] = await db
      .select()
      .from(attendanceSessions)
      .where(and(eq(attendanceSessions.id, id), eq(attendanceSessions.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Attendance session not found.");

    const [row] = await db
      .update(attendanceSessions)
      .set({
        sessionDate: parsed.data.sessionDate ?? existing.sessionDate,
        topic: parsed.data.topic === undefined ? existing.topic : parsed.data.topic,
        updatedAt: new Date(),
      })
      .where(eq(attendanceSessions.id, id))
      .returning();

    await writeAudit({
      actor,
      action: "attendance.session.update",
      targetType: "attendance_session",
      targetId: id,
      collegeId,
      metadata: parsed.data,
    });
    return ok(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("attendance_session_unique")) {
      return validationError("An attendance session already exists for this date.");
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const [existing] = await db
      .select()
      .from(attendanceSessions)
      .where(and(eq(attendanceSessions.id, id), eq(attendanceSessions.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Attendance session not found.");
    await db.delete(attendanceSessions).where(eq(attendanceSessions.id, id));
    await writeAudit({
      actor,
      action: "attendance.session.delete",
      targetType: "attendance_session",
      targetId: id,
      collegeId,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
