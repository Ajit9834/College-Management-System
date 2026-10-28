import { redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { Clock, ShieldX } from "lucide-react";
import { db } from "@/db";
import { auditLogs, colleges } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { collegePortalActive, getCurrentUser } from "@/lib/auth";
import {
  COLLEGE_PORTAL_ROLES,
  hasRole,
  portalForUser,
  primaryCollegeId,
} from "@/lib/permissions";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function PendingApprovalPage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!hasRole(user, COLLEGE_PORTAL_ROLES) || (await collegePortalActive(user))) {
    redirect(portalForUser(user) ?? "/");
  }

  const collegeId = primaryCollegeId(user);
  const [college] = collegeId
    ? await db.select().from(colleges).where(eq(colleges.id, collegeId)).limit(1)
    : [];
  const rejected = college?.status === "rejected";

  // A rejection carries the reviewer's reason so the college knows why it was declined.
  const [rejection] = rejected && collegeId
    ? await db
        .select({ metadata: auditLogs.metadata })
        .from(auditLogs)
        .where(and(eq(auditLogs.targetId, collegeId), eq(auditLogs.action, "college.reject")))
        .orderBy(desc(auditLogs.createdAt))
        .limit(1)
    : [];
  const reason = (rejection?.metadata as { note?: string | null } | null)?.note;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <div className="card w-full max-w-lg p-10 text-center">
        <span
          className={
            rejected
              ? "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700"
              : "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"
          }
        >
          {rejected ? <ShieldX className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          {rejected ? "Registration not approved" : "Awaiting approval"}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {rejected ? (
            <>
              The registration for{" "}
              <span className="font-medium text-slate-900">
                {college?.name ?? "your college"}
              </span>{" "}
              was reviewed and not approved. The college portal remains unavailable. Please
              contact a platform administrator for more information.
            </>
          ) : (
            <>
              Your sign-in worked, but{" "}
              <span className="font-medium text-slate-900">
                {college?.name ?? "your college"}
              </span>{" "}
              is still pending approval. The college portal unlocks as soon as a platform
              administrator approves the registration.
            </>
          )}
        </p>
        {rejected && typeof reason === "string" && reason.trim() ? (
          <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-left text-sm text-rose-900">
            <span className="font-medium">Reason given: </span>
            {reason.trim()}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <LogoutButton className="btn btn-primary" />
          <Link href="/register/college" className="btn btn-ghost">
            Register another college
          </Link>
        </div>
      </div>
    </main>
  );
}
