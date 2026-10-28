import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, departments } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { courseUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = courseUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [existing] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), eq(courses.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Course not found.");

    if (parsed.data.departmentId) {
      const [department] = await db
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.id, parsed.data.departmentId),
            eq(departments.collegeId, collegeId),
          ),
        )
        .limit(1);
      if (!department) return validationError("Select a department in this college.");
    }

    const [row] = await db
      .update(courses)
      .set({
        title: parsed.data.title ?? existing.title,
        code: parsed.data.code ?? existing.code,
        departmentId: parsed.data.departmentId ?? existing.departmentId,
        credits: parsed.data.credits ?? existing.credits,
        description:
          parsed.data.description === undefined
            ? existing.description
            : parsed.data.description,
        isActive: parsed.data.isActive ?? existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    await writeAudit({
      actor,
      action: "course.update",
      targetType: "course",
      targetId: id,
      collegeId,
      metadata: parsed.data,
    });
    return ok(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("courses_college_code_unique")) {
      return validationError("Course code already exists in this college.");
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
      .from(courses)
      .where(and(eq(courses.id, id), eq(courses.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Course not found.");
    await db.delete(courses).where(eq(courses.id, id));
    await writeAudit({
      actor,
      action: "course.delete",
      targetType: "course",
      targetId: id,
      collegeId,
      metadata: { code: existing.code },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
