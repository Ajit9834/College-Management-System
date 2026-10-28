import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { departments, programs } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { programUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = programUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [existing] = await db
      .select()
      .from(programs)
      .where(and(eq(programs.id, id), eq(programs.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Program not found.");

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
      .update(programs)
      .set({
        name: parsed.data.name ?? existing.name,
        code: parsed.data.code ?? existing.code,
        departmentId: parsed.data.departmentId ?? existing.departmentId,
        durationSemesters: parsed.data.durationSemesters ?? existing.durationSemesters,
        isActive: parsed.data.isActive ?? existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(programs.id, id))
      .returning();

    await writeAudit({
      actor,
      action: "program.update",
      targetType: "program",
      targetId: id,
      collegeId,
      metadata: parsed.data,
    });
    return ok(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("programs_college_code_unique")) {
      return validationError("Program code already exists in this college.");
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
      .from(programs)
      .where(and(eq(programs.id, id), eq(programs.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Program not found.");
    await db.delete(programs).where(eq(programs.id, id));
    await writeAudit({
      actor,
      action: "program.delete",
      targetType: "program",
      targetId: id,
      collegeId,
      metadata: { code: existing.code },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
