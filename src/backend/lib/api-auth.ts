import { NextResponse } from "next/server";
import { collegePortalActive, getCurrentUser } from "@/lib/auth";
import { conflict, fail, forbidden, serverError, unauthorized } from "@/lib/api";
import {
  canAccessCollege,
  hasRole,
  isPlatformAdmin,
  primaryCollegeId,
  type AuthUser,
} from "@/lib/permissions";
import type { RoleName } from "@/db/schema";
import { ZodError } from "zod";
import { validationError } from "@/lib/api";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "UNAUTHENTICATED", "Please sign in to continue.");
  return user;
}

export async function apiRequire(roles?: RoleName[]): Promise<AuthUser> {
  const user = await apiUser();
  if (roles && !hasRole(user, roles) && !isPlatformAdmin(user)) {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action.");
  }
  // A college that has not been approved (or was rejected) must not reach any
  // protected college-portal endpoint, even with a valid college role.
  if (!(await collegePortalActive(user))) {
    throw new HttpError(
      403,
      "COLLEGE_NOT_APPROVED",
      "This college registration is awaiting approval. Please try again once an administrator approves it.",
    );
  }
  return user;
}

export function requireCollegeId(user: AuthUser, requested?: string | null): string {
  if (isPlatformAdmin(user)) {
    if (requested) return requested;
    const scoped = primaryCollegeId(user);
    if (scoped) return scoped;
    throw new HttpError(422, "VALIDATION_ERROR", "collegeId is required.");
  }
  const scoped = primaryCollegeId(user);
  if (!scoped) {
    throw new HttpError(403, "FORBIDDEN", "No college is assigned to this account.");
  }
  if (requested && requested !== scoped && !canAccessCollege(user, requested)) {
    throw new HttpError(403, "FORBIDDEN", "You cannot access another college.");
  }
  return scoped;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    if (error.status === 401) return unauthorized(error.message);
    if (error.status === 403) return forbidden(error.message);
    return fail(error.code, error.message, error.status);
  }
  if (error instanceof ZodError) {
    return validationError(error);
  }
  if (error instanceof Error && /foreign key constraint/i.test(error.message)) {
    return conflict("This record is still referenced by other data and cannot be removed.");
  }
  console.error(error);
  return serverError();
}
