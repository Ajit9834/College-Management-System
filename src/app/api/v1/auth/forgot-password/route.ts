import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { fail, ok, validationError } from "@/lib/api";
import { handleApiError } from "@/lib/api-auth";
import { generateResetToken, hashResetToken } from "@/lib/crypto";
import { sendPasswordResetEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const TOKEN_TTL_MINUTES = 30;

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const parsed = forgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const email = parsed.data.email;
    if (!rateLimit(`forgot:ip:${ip}`, 5, 15 * 60_000) || !rateLimit(`forgot:email:${email}`, 3, 15 * 60_000)) {
      return fail("RATE_LIMITED", "Too many reset requests. Please try again later.", 429);
    }

    // Always answer the same way so the endpoint cannot be used to probe accounts.
    const accepted = ok({ requested: true });
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || user.status !== "active") return accepted;

    await db
      .delete(passwordResetTokens)
      .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));

    const token = generateResetToken();
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000),
    });

    const baseUrl = process.env.APP_URL || new URL(request.url).origin;
    try {
      await sendPasswordResetEmail({
        to: user.email,
        fullName: user.fullName,
        resetUrl: `${baseUrl}/reset-password?token=${token}`,
        expiresInMinutes: TOKEN_TTL_MINUTES,
      });
    } catch (error) {
      // A delivery failure must not change the response: throwing would break the
      // identical answer given to every caller and reveal that the account exists.
      console.error("[mail] Failed to send the password reset email", error);
    }

    return accepted;
  } catch (error) {
    return handleApiError(error);
  }
}
