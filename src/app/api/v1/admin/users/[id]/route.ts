import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userRoles, users } from "@/db/schema";
import { forbidden, notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  fullName: z.string().min(2).max(160).optional(),
  phone: z.string().max(40).optional().nullable(),
  status: z.enum(["active", "suspended", "deactivated"]).optional(),
  password: z.string().min(8).optional().nullable(),
  role: z
    .enum(["platform_admin", "college_admin", "faculty", "accounts_staff", "student"])
    .optional(),
  collegeId: z.string().uuid().optional().nullable(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["platform_admin"]);
    const { id } = await context.params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing) return notFound("User not found.");

    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (parsed.data.fullName) updates.fullName = parsed.data.fullName;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.password) {
      updates.passwordHash = await hashPassword(parsed.data.password);
      // Sign the user out everywhere so the old password's sessions cannot continue.
      updates.sessionEpoch = existing.sessionEpoch + 1;
    }

    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();

    if (parsed.data.role) {
      await db.delete(userRoles).where(eq(userRoles.userId, id));
      await db.insert(userRoles).values({
        userId: id,
        role: parsed.data.role,
        collegeId: parsed.data.role === "platform_admin" ? null : parsed.data.collegeId ?? null,
      });
    }

    await writeAudit({
      actor,
      action: "user.update",
      targetType: "user",
      targetId: id,
      collegeId: parsed.data.collegeId ?? null,
      metadata: parsed.data,
    });

    const { passwordHash: _ignored, ...safe } = user;
    return ok(safe);
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
    if (id === actor.id) {
      return forbidden("You cannot delete your own account.");
    }
    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing) return notFound("User not found.");

    await db.delete(users).where(eq(users.id, id));

    await writeAudit({
      actor,
      action: "user.delete",
      targetType: "user",
      targetId: id,
      metadata: { email: existing.email, fullName: existing.fullName },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
