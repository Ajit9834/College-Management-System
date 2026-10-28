import { redirect } from "next/navigation";
import { collegePortalActive, getCurrentUser } from "@/lib/auth";
import {
  canAccessCollege,
  COLLEGE_PORTAL_ROLES,
  hasRole,
  isPlatformAdmin,
  portalForUser,
  type AuthUser,
} from "@/lib/permissions";
import type { RoleName } from "@/db/schema";

export async function requirePageUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

export async function requireStudentPage(): Promise<AuthUser> {
  const user = await requirePageUser();
  if (!hasRole(user, ["student"])) redirect(portalForUser(user) ?? "/");
  return user;
}

export async function requireCollegePage(roles?: RoleName[]): Promise<AuthUser> {
  const user = await requirePageUser();
  if (!hasRole(user, roles ?? COLLEGE_PORTAL_ROLES)) {
    redirect(portalForUser(user) ?? "/");
  }
  // Self-registered colleges stay locked out until a platform admin approves them.
  if (!(await collegePortalActive(user))) {
    redirect("/pending-approval");
  }
  return user;
}

export async function requireAdminPage(): Promise<AuthUser> {
  const user = await requirePageUser();
  if (!isPlatformAdmin(user)) redirect(portalForUser(user) ?? "/");
  return user;
}

export function assertCollegeScope(user: AuthUser, collegeId: string) {
  if (!canAccessCollege(user, collegeId)) {
    redirect("/access-denied");
  }
}
