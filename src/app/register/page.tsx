import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { colleges, departments, programs, users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, readGoogleSignupEmail } from "@/lib/auth";
import { portalForUser } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { GoogleAuthButton, OrDivider } from "@/components/google-auth-button";
import { RegisterNav } from "@/components/register-nav";
import { RegisterForm } from "@/components/register-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; email?: string }>;
}) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (user) redirect(portalForUser(user) ?? "/");

  const { reason, email } = await searchParams;
  // Only the signed cookie set by the OAuth callback is trusted as the verified
  // Google address; the `?email=` parameter is display-only.
  const verifiedGoogleEmail = await readGoogleSignupEmail();
  const googleNoticeEmail = verifiedGoogleEmail ?? email;

  if (verifiedGoogleEmail) {
    // A student account may only be created once. Never build a second one.
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, verifiedGoogleEmail))
      .limit(1);
    if (existing) redirect("/login?error=account_exists");
  }

  const [collegeRows, departmentRows, programRows] = await Promise.all([
    db
      .select({ id: colleges.id, name: colleges.name, code: colleges.code })
      .from(colleges)
      .where(eq(colleges.status, "active"))
      .orderBy(asc(colleges.name)),
    db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
        collegeId: departments.collegeId,
      })
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(asc(departments.name)),
    db
      .select({
        id: programs.id,
        name: programs.name,
        code: programs.code,
        collegeId: programs.collegeId,
        departmentId: programs.departmentId,
        durationSemesters: programs.durationSemesters,
      })
      .from(programs)
      .where(eq(programs.isActive, true))
      .orderBy(asc(programs.name)),
  ]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <div className="card w-full max-w-3xl p-10">
        <PageHeader
          title="Create your student account"
          description="Register with your college, department, and program to access the student portal."
        />
        <RegisterNav current="/register" />
        {reason === "no_account" ? (
          <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No CampusFlow account exists for{" "}
            <span className="font-medium">{googleNoticeEmail || "that Google account"}</span>.
            Complete the form below to create your student account.
          </div>
        ) : null}
        <GoogleAuthButton label="Sign up with Google" />
        <OrDivider />
        {collegeRows.length === 0 ? (
          <p className="text-sm text-slate-600">
            No colleges are available for registration yet. Please contact your college office.
          </p>
        ) : (
          <RegisterForm
            colleges={collegeRows}
            departments={departmentRows}
            programs={programRows}
            defaultEmail={verifiedGoogleEmail ?? undefined}
            emailVerifiedByGoogle={Boolean(verifiedGoogleEmail)}
          />
        )}
        <p className="mt-6 text-sm text-slate-600">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-indigo-600">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
