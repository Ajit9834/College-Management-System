import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { colleges, userRoles, users } from "@/db/schema";
import { signToken, verifyToken } from "@/lib/crypto";
import type { AuthUser, SessionRole } from "@/lib/permissions";
import {
  COLLEGE_PORTAL_ROLES,
  hasRole,
  isActive,
  isPlatformAdmin,
  primaryCollegeId,
} from "@/lib/permissions";
import type { RoleName } from "@/db/schema";

export const SESSION_COOKIE = "cms_session";
export const GOOGLE_SIGNUP_COOKIE = "cms_google_signup";
const GOOGLE_SIGNUP_TTL_SECONDS = 60 * 15;

type GoogleSignupPayload = {
  googleEmail: string;
  exp?: number;
};

type TokenPayload = {
  userId: string;
  email: string;
  fullName: string;
  status: AuthUser["status"];
  roles: SessionRole[];
  epoch?: number;
  exp?: number;
};

export async function loadAuthUser(
  userId: string,
  expectedEpoch?: number,
): Promise<AuthUser | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  if (expectedEpoch !== undefined && user.sessionEpoch !== expectedEpoch) return null;
  const roles = await db
    .select({
      role: userRoles.role,
      collegeId: userRoles.collegeId,
    })
    .from(userRoles)
    .where(eq(userRoles.userId, user.id));

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    phone: user.phone,
    sessionEpoch: user.sessionEpoch,
    roles: roles.map((r) => ({
      role: r.role as RoleName,
      collegeId: r.collegeId,
    })),
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken<TokenPayload>(token);
  if (!payload?.userId) return null;
  // Sessions issued before the epoch was introduced carry no value and stay valid.
  const user = await loadAuthUser(payload.userId, payload.epoch ?? 0);
  if (!user || !isActive(user)) return null;
  return user;
}

/**
 * Whether this account may use college-portal features.
 *
 * A self-registered college starts `pending` and stays fully locked out of the
 * portal until a platform admin approves it. Platform admins and non-college
 * accounts are never restricted by college status.
 */
export async function collegePortalActive(user: AuthUser): Promise<boolean> {
  if (isPlatformAdmin(user) || !hasRole(user, COLLEGE_PORTAL_ROLES)) return true;
  const collegeId = primaryCollegeId(user);
  if (!collegeId) return true;
  const [row] = await db
    .select({ status: colleges.status })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .limit(1);
  return row?.status === "active";
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const error = new Error("UNAUTHENTICATED");
    throw error;
  }
  return user;
}

export function buildSessionToken(user: AuthUser): string {
  return signToken({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    roles: user.roles,
    epoch: user.sessionEpoch,
  });
}

export async function setSessionCookie(user: AuthUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, buildSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Records that Google verified ownership of this address, so the registration
 * form may be completed for exactly that email. The value is HMAC-signed and
 * short-lived, which is what makes the association trustworthy: a `?email=`
 * query parameter alone could be edited by anyone.
 */
export async function setGoogleSignupCookie(email: string) {
  const store = await cookies();
  store.set(
    GOOGLE_SIGNUP_COOKIE,
    signToken({ googleEmail: email }, GOOGLE_SIGNUP_TTL_SECONDS),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GOOGLE_SIGNUP_TTL_SECONDS,
    },
  );
}

export async function readGoogleSignupEmail(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(GOOGLE_SIGNUP_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken<GoogleSignupPayload>(token);
  return payload?.googleEmail ?? null;
}

export async function clearGoogleSignupCookie() {
  const store = await cookies();
  store.delete(GOOGLE_SIGNUP_COOKIE);
}

export function readSessionFromCookieValue(token: string | undefined): TokenPayload | null {
  if (!token) return null;
  return verifyToken<TokenPayload>(token);
}
