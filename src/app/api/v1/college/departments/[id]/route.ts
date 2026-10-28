import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { departmentUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = departmentUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [existing] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.id, id), eq(departments.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Department not found.");

    const [row] = await db
      .update(departments)
      .set({
        name: parsed.data.name ?? existing.name,
        code: parsed.data.code ?? existing.code,
        description:
          parsed.data.description === undefined
            ? existing.description
            : parsed.data.description,
        isActive: parsed.data.isActive ?? existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id))
      .returning();

    await writeAudit({
      actor,
      action: "department.update",
      targetType: "department",
      targetId: id,
      collegeId,
      metadata: parsed.data,
    });
    return ok(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("departments_college_code_unique")) {
      return validationError("Department code already exists in this college.");
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
      .from(departments)
      .where(and(eq(departments.id, id), eq(departments.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Department not found.");
    await db.delete(departments).where(eq(departments.id, id));
    await writeAudit({
      actor,
      action: "department.delete",
      targetType: "department",
      targetId: id,
      collegeId,
      metadata: { code: existing.code },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
