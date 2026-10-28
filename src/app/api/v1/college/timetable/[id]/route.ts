import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { timetableEntries } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { findTimetableConflict } from "@/lib/data";
import { timetableUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = timetableUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [existing] = await db
      .select()
      .from(timetableEntries)
      .where(and(eq(timetableEntries.id, id), eq(timetableEntries.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Timetable slot not found.");

    const startsAt = parsed.data.startsAt ?? existing.startsAt;
    const endsAt = parsed.data.endsAt ?? existing.endsAt;
    if (endsAt <= startsAt) {
      return validationError("End time must be after the start time.");
    }

    const weekday = parsed.data.weekday ?? existing.weekday;
    const room = parsed.data.room === undefined ? existing.room : parsed.data.room;
    const conflict = await findTimetableConflict({
      collegeId,
      weekday,
      startsAt,
      endsAt,
      room,
      offeringId: existing.offeringId,
      excludeId: id,
    });
    if (conflict) return validationError(conflict);

    const [row] = await db
      .update(timetableEntries)
      .set({
        weekday,
        startsAt,
        endsAt,
        room,
        updatedAt: new Date(),
      })
      .where(eq(timetableEntries.id, id))
      .returning();

    await writeAudit({
      actor,
      action: "timetable.update",
      targetType: "timetable_entry",
      targetId: id,
      collegeId,
      metadata: parsed.data,
    });
    return ok(row);
  } catch (error) {
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
      .from(timetableEntries)
      .where(and(eq(timetableEntries.id, id), eq(timetableEntries.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Timetable slot not found.");
    await db.delete(timetableEntries).where(eq(timetableEntries.id, id));
    await writeAudit({
      actor,
      action: "timetable.delete",
      targetType: "timetable_entry",
      targetId: id,
      collegeId,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
