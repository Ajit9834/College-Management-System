import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { colleges, departments, programs, students, userRoles, users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { fail, ok, validationError } from "@/lib/api";
import { loadAuthUser, readGoogleSignupEmail, setSessionCookie, clearGoogleSignupCookie } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/crypto";
import { getSettingsMap } from "@/lib/data";
import { portalForUser } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`register:${ip}`, 5)) {
      return fail("RATE_LIMITED", "Too many sign-up attempts. Please wait a minute.", 429);
    }

    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const data = parsed.data;

    // If the OAuth callback proved this address with Google, the account must be
    // created for exactly that address; otherwise the verified identity and the
    // new account would silently diverge.
    const verifiedGoogleEmail = await readGoogleSignupEmail();
    if (verifiedGoogleEmail && verifiedGoogleEmail !== data.email) {
      return validationError("Register with the Google account you signed in with.");
    }

    const [[college], [department], [program]] = await Promise.all([
      db
        .select({ id: colleges.id })
        .from(colleges)
        .where(and(eq(colleges.id, data.collegeId), eq(colleges.status, "active")))
        .limit(1),
      db
        .select({ id: departments.id })
        .from(departments)
        .where(
          and(
            eq(departments.id, data.departmentId),
            eq(departments.collegeId, data.collegeId),
            eq(departments.isActive, true),
          ),
        )
        .limit(1),
      db
        .select({ id: programs.id })
        .from(programs)
        .where(
          and(
            eq(programs.id, data.programId),
            eq(programs.collegeId, data.collegeId),
            eq(programs.departmentId, data.departmentId),
            eq(programs.isActive, true),
          ),
        )
        .limit(1),
    ]);

    if (!college) return validationError("Select an active college.");
    if (!department) return validationError("Select a department that belongs to the chosen college.");
    if (!program) return validationError("Select a program that belongs to the chosen department.");

    const settings = await getSettingsMap();
    const academicYear = settings.academic_year || "2025-2026";
    const passwordHash = await hashPassword(data.password);

    const result = await db.transaction(async (tx) => {
      const [account] = await tx
        .insert(users)
        .values({
          email: data.email,
          fullName: data.fullName,
          phone: data.phone ?? null,
          passwordHash,
          status: "active",
          lastLoginAt: new Date(),
        })
        .returning();

      // Self-registration always grants the student role only — no Google or
      // self-service path can ever create an admin or college role.
      await tx.insert(userRoles).values({
        userId: account.id,
        role: "student",
        collegeId: data.collegeId,
      });

      const [student] = await tx
        .insert(students)
        .values({
          userId: account.id,
          collegeId: data.collegeId,
          programId: data.programId,
          departmentId: data.departmentId,
          registrationNo: data.registrationNo,
          currentSemester: data.currentSemester,
          academicYear,
          dateOfBirth: data.dateOfBirth || null,
          status: "active",
        })
        .returning();

      return { account, student };
    });

    const authUser = await loadAuthUser(result.account.id);
    if (!authUser) {
      return fail("INTERNAL_ERROR", "Account created but sign-in failed. Please sign in.", 500);
    }

    await writeAudit({
      actor: authUser,
      action: "student.register",
      targetType: "student",
      targetId: result.student.id,
      collegeId: data.collegeId,
      metadata: {
        registrationNo: result.student.registrationNo,
        selfRegistered: true,
        googleLinked: Boolean(verifiedGoogleEmail),
      },
    });

    // The signed proof is single-use: once the account exists it is redundant.
    if (verifiedGoogleEmail) await clearGoogleSignupCookie();

    await setSessionCookie(authUser);
    return ok(
      {
        user: {
          id: authUser.id,
          email: authUser.email,
          fullName: authUser.fullName,
          roles: authUser.roles,
        },
        portal: portalForUser(authUser),
      },
      {},
      201,
    );
  } catch (error) {
    // Drizzle wraps driver errors, so the constraint name sits on the cause.
    const cause = (error as { cause?: unknown } | null)?.cause;
    const message = `${error instanceof Error ? error.message : ""} ${
      cause instanceof Error ? cause.message : ""
    }`;
    if (message.includes("users_email_unique")) {
      return validationError("An account with this email already exists.");
    }
    if (message.includes("students_college_reg_unique")) {
      return validationError("Registration number already exists in this college.");
    }
    console.error(error);
    return fail("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
  }
}
