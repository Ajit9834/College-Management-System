import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courseEnrollments, courseOfferings } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { enrollmentUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = enrollmentUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [existing] = await db
      .select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.id, id))
      .limit(1);
    if (!existing) return notFound("Enrollment not found.");

    const [offering] = await db
      .select()
      .from(courseOfferings)
      .where(eq(courseOfferings.id, existing.offeringId))
      .limit(1);
    if (!offering || offering.collegeId !== collegeId) {
      return notFound("Enrollment not found.");
    }

    const [row] = await db
      .update(courseEnrollments)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(courseEnrollments.id, id))
      .returning();

    await writeAudit({
      actor,
      action: "enrollment.update",
      targetType: "enrollment",
      targetId: id,
      collegeId,
      metadata: { status: parsed.data.status },
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
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const [existing] = await db
      .select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.id, id))
      .limit(1);
    if (!existing) return notFound("Enrollment not found.");
    const [offering] = await db
      .select()
      .from(courseOfferings)
      .where(eq(courseOfferings.id, existing.offeringId))
      .limit(1);
    if (!offering || offering.collegeId !== collegeId) {
      return notFound("Enrollment not found.");
    }
    await db.delete(courseEnrollments).where(eq(courseEnrollments.id, id));
    await writeAudit({
      actor,
      action: "enrollment.delete",
      targetType: "enrollment",
      targetId: id,
      collegeId,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
