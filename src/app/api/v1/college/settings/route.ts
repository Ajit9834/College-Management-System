import { eq } from "drizzle-orm";
import { db } from "@/db";
import { colleges } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { collegeSettingsSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await apiRequire(["college_admin", "faculty", "accounts_staff"]);
    const collegeId = requireCollegeId(actor);
    const [row] = await db.select().from(colleges).where(eq(colleges.id, collegeId)).limit(1);
    if (!row) return notFound("College not found.");
    return ok(row);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await apiRequire(["college_admin"]);
    // Always the caller's own college. College name, code, and status stay platform-owned.
    const collegeId = requireCollegeId(actor);
    const parsed = collegeSettingsSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const data = parsed.data;
    const updates: Partial<typeof colleges.$inferInsert> = { updatedAt: new Date() };
    // Only fields present in the request are touched; blanks clear the field.
    if (data.city !== undefined) updates.city = data.city || null;
    if (data.state !== undefined) updates.state = data.state || null;
    if (data.address !== undefined) updates.address = data.address || null;
    if (data.phone !== undefined) updates.phone = data.phone || null;
    if (data.email !== undefined) updates.email = data.email || null;
    if (data.website !== undefined) updates.website = data.website || null;

    const [row] = await db
      .update(colleges)
      .set(updates)
      .where(eq(colleges.id, collegeId))
      .returning();
    if (!row) return notFound("College not found.");

    await writeAudit({
      actor,
      action: "college.settings_update",
      targetType: "college",
      targetId: collegeId,
      collegeId,
      metadata: data,
    });

    return ok(row);
  } catch (error) {
    return handleApiError(error);
  }
}
