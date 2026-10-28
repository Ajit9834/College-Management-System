import { eq } from "drizzle-orm";
import { db } from "@/db";
import { colleges, students } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { collegeSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await apiRequire(["platform_admin"]);
    const { id } = await context.params;
    const [row] = await db.select().from(colleges).where(eq(colleges.id, id)).limit(1);
    if (!row) return notFound("College not found.");
    return ok(row);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["platform_admin"]);
    const { id } = await context.params;
    const parsed = collegeSchema.partial().safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [existing] = await db.select().from(colleges).where(eq(colleges.id, id)).limit(1);
    if (!existing) return notFound("College not found.");
    const [row] = await db
      .update(colleges)
      .set({ ...parsed.data, email: parsed.data.email || existing.email, updatedAt: new Date() })
      .where(eq(colleges.id, id))
      .returning();
    await writeAudit({
      actor,
      action: "college.update",
      targetType: "college",
      targetId: id,
      collegeId: id,
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
    const actor = await apiRequire(["platform_admin"]);
    const { id } = await context.params;
    const [existing] = await db.select().from(colleges).where(eq(colleges.id, id)).limit(1);
    if (!existing) return notFound("College not found.");

    // Students reference departments/programs with ON DELETE RESTRICT, so remove
    // them before cascading away the rest of the college's data.
    await db.transaction(async (tx) => {
      await tx.delete(students).where(eq(students.collegeId, id));
      await tx.delete(colleges).where(eq(colleges.id, id));
    });

    await writeAudit({
      actor,
      action: "college.delete",
      targetType: "college",
      targetId: id,
      collegeId: id,
      metadata: { code: existing.code, name: existing.name },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
