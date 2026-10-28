import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { courseOfferings } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { offeringUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = offeringUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [existing] = await db
      .select()
      .from(courseOfferings)
      .where(and(eq(courseOfferings.id, id), eq(courseOfferings.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Course offering not found.");

    const [row] = await db
      .update(courseOfferings)
      .set({
        academicYear: parsed.data.academicYear ?? existing.academicYear,
        semester: parsed.data.semester ?? existing.semester,
        facultyUserId:
          parsed.data.facultyUserId === undefined
            ? existing.facultyUserId
            : parsed.data.facultyUserId,
        status: parsed.data.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(courseOfferings.id, id))
      .returning();

    await writeAudit({
      actor,
      action: "offering.update",
      targetType: "course_offering",
      targetId: id,
      collegeId,
      metadata: parsed.data,
    });
    return ok(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("offerings_unique")) {
      return validationError("This course is already offered for that year and semester.");
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const [existing] = await db
      .select()
      .from(courseOfferings)
      .where(and(eq(courseOfferings.id, id), eq(courseOfferings.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Course offering not found.");
    await db.delete(courseOfferings).where(eq(courseOfferings.id, id));
    await writeAudit({
      actor,
      action: "offering.delete",
      targetType: "course_offering",
      targetId: id,
      collegeId,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
