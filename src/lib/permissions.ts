import type { RoleName } from "@/db/schema";

export type SessionRole = {
  role: RoleName;
  collegeId: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  status: "active" | "suspended" | "deactivated";
  phone: string | null;
  sessionEpoch: number;
  roles: SessionRole[];
};

export const STUDENT_PORTAL_ROLES: RoleName[] = ["student"];
export const COLLEGE_PORTAL_ROLES: RoleName[] = [
  "college_admin",
  "faculty",
  "accounts_staff",
];
export const ADMIN_PORTAL_ROLES: RoleName[] = ["platform_admin"];

export function isActive(user: AuthUser): boolean {
  return user.status === "active";
}

export function hasRole(user: AuthUser, roles: RoleName[]): boolean {
  return user.roles.some((r) => roles.includes(r.role));
}

export function isPlatformAdmin(user: AuthUser): boolean {
  return hasRole(user, ["platform_admin"]);
}

export function collegeScopeIds(user: AuthUser): string[] {
  return user.roles
    .map((r) => r.collegeId)
    .filter((id): id is string => Boolean(id));
}

export function primaryCollegeId(user: AuthUser): string | null {
  return collegeScopeIds(user)[0] ?? null;
}

export function canAccessCollege(user: AuthUser, collegeId: string): boolean {
  if (isPlatformAdmin(user)) return true;
  return user.roles.some((r) => r.collegeId === collegeId);
}

export function canManageStudents(user: AuthUser): boolean {
  return hasRole(user, ["college_admin"]);
}

export function canViewCollegeStudents(user: AuthUser): boolean {
  return hasRole(user, ["college_admin", "faculty", "accounts_staff"]);
}

/**
 * Faculty who are not also college admins or accounts staff are limited to the
 * offerings they teach (and the students enrolled in them).
 */
export function isFacultyScoped(user: AuthUser): boolean {
  return hasRole(user, ["faculty"]) && !hasRole(user, ["college_admin", "accounts_staff"]);
}

export function canManageAcademics(user: AuthUser): boolean {
  return hasRole(user, ["college_admin"]);
}

export function canManageTimetable(user: AuthUser): boolean {
  return hasRole(user, ["college_admin", "faculty"]);
}

export function canRecordAttendance(user: AuthUser): boolean {
  return hasRole(user, ["college_admin", "faculty"]);
}

export function canEnterMarks(user: AuthUser): boolean {
  return hasRole(user, ["college_admin", "faculty"]);
}

export function canPublishResults(user: AuthUser): boolean {
  return hasRole(user, ["college_admin"]);
}

export function canManageFees(user: AuthUser): boolean {
  return hasRole(user, ["college_admin", "accounts_staff"]);
}

export function canManageNotices(user: AuthUser): boolean {
  return hasRole(user, ["college_admin"]);
}

export function canManageCollegeSettings(user: AuthUser): boolean {
  return hasRole(user, ["college_admin"]);
}

export function canAccessStudentRecord(
  user: AuthUser,
  student: { id: string; userId: string; collegeId: string },
): boolean {
  if (isPlatformAdmin(user)) return true;
  if (hasRole(user, ["student"])) {
    return student.userId === user.id;
  }
  return canAccessCollege(user, student.collegeId);
}

export function portalForUser(user: AuthUser): "/admin" | "/college" | "/student" | null {
  if (hasRole(user, ["platform_admin"])) return "/admin";
  if (hasRole(user, COLLEGE_PORTAL_ROLES)) return "/college";
  if (hasRole(user, ["student"])) return "/student";
  return null;
}

export function roleLabel(role: RoleName): string {
  switch (role) {
    case "platform_admin":
      return "Platform Admin";
    case "college_admin":
      return "College Admin";
    case "faculty":
      return "Faculty";
    case "accounts_staff":
      return "Accounts Staff";
    case "student":
      return "Student";
  }
}

export function computeGrade(marks: number, maxMarks: number): string {
  if (maxMarks <= 0) return "N/A";
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

export function letterFromStatus(status: string): string {
  return status.replaceAll("_", " ");
}
