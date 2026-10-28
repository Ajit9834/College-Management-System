import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { fail, ok, validationError } from "@/lib/api";
import { loadAuthUser, setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import {
  COLLEGE_PORTAL_ROLES,
  hasRole,
  isPlatformAdmin,
  portalForUser,
  STUDENT_PORTAL_ROLES,
  type AuthUser,
} from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Portal = "student" | "college" | "admin";

// Returned when the credentials are correct but the account does not belong to the
// portal whose sign-in page was used. The dedicated portal pages pass `portal`, so
// this check runs on the server rather than relying on a client-side redirect.
const PORTAL_DENIED: Record<Portal, string> = {
  student: "This account is not a student account. Use the sign-in page for your portal.",
  college: "This account does not have college portal access. Use the sign-in page for your portal.",
  admin: "This account does not have administrator access. Use the sign-in page for your portal.",
};

function portalAllowed(user: AuthUser, portal: Portal): boolean {
  if (portal === "admin") return isPlatformAdmin(user);
  if (portal === "college") return hasRole(user, COLLEGE_PORTAL_ROLES);
  return hasRole(user, STUDENT_PORTAL_ROLES);
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`login:${ip}`)) {
      return fail("RATE_LIMITED", "Too many sign-in attempts. Please wait a minute.", 429);
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    if (!user) {
      return fail("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
    }
    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return fail("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
    }
    if (user.status !== "active") {
      return fail("ACCOUNT_SUSPENDED", "This account is suspended or deactivated.", 403);
    }

    const authUser = await loadAuthUser(user.id);
    if (!authUser) {
      return fail("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
    }

    const requestedPortal = parsed.data.portal;
    if (requestedPortal && !portalAllowed(authUser, requestedPortal)) {
      return fail("ROLE_NOT_ALLOWED", PORTAL_DENIED[requestedPortal], 403);
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await setSessionCookie(authUser);
    return ok({
      user: {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.fullName,
        roles: authUser.roles,
      },
      portal: portalForUser(authUser),
    });
  } catch (error) {
    console.error(error);
    return fail("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
  }
}
