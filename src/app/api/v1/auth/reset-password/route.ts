import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { fail, ok, validationError } from "@/lib/api";
import { handleApiError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { hashPassword, hashResetToken } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`reset:${ip}`, 10, 15 * 60_000)) {
      return fail("RATE_LIMITED", "Too many attempts. Please request a new link later.", 429);
    }

    const parsed = resetPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, hashResetToken(parsed.data.token)))
      .limit(1);

    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      return fail(
        "INVALID_TOKEN",
        "This reset link is invalid or has expired. Please request a new one.",
        400,
      );
    }

    const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
    if (!user) {
      return fail("INVALID_TOKEN", "This reset link is invalid. Please request a new one.", 400);
    }

    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(parsed.data.password),
        // Invalidate every session that was issued before this reset.
        sessionEpoch: user.sessionEpoch + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, row.id));
    await db
      .delete(passwordResetTokens)
      .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));

    await writeAudit({
      actor: null,
      action: "auth.password_reset",
      targetType: "user",
      targetId: user.id,
      collegeId: null,
      metadata: { method: "email_link" },
    });

    return ok({ reset: true });
  } catch (error) {
    return handleApiError(error);
  }
}
