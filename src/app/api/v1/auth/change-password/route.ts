import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { fail, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { loadAuthUser, setSessionCookie } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { changePasswordSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const actor = await apiRequire();
    const parsed = changePasswordSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [user] = await db.select().from(users).where(eq(users.id, actor.id)).limit(1);
    if (!user) return fail("NOT_FOUND", "Account not found.", 404);

    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return fail("INVALID_CREDENTIALS", "Your current password is incorrect.", 400);
    }

    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(parsed.data.newPassword),
        // Invalidate every session issued before this change (other devices).
        sessionEpoch: user.sessionEpoch + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Keep this device signed in under the new epoch.
    const refreshed = await loadAuthUser(user.id);
    if (refreshed) await setSessionCookie(refreshed);

    await writeAudit({
      actor,
      action: "auth.password_change",
      targetType: "user",
      targetId: user.id,
      collegeId: null,
      metadata: { method: "self_service" },
    });

    return ok({ changed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
