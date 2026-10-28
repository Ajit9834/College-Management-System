import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureSeeded } from "@/db/seed";
import { collegePortalActive, getCurrentUser } from "@/lib/auth";
import { COLLEGE_PORTAL_ROLES, hasRole } from "@/lib/permissions";
import { LoginForm } from "@/components/login-form";
import { PortalLoginLinks, PortalLoginShell } from "@/components/portal-login";

export const dynamic = "force-dynamic";

/**
 * College portal sign-in.
 *
 * This page lives in the `(portal-login)` route group on purpose: the group is not
 * wrapped by `app/college/layout.tsx`, so the page renders before anyone is
 * authenticated instead of being bounced by the college guard.
 */
export default async function CollegeLoginPage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  // Someone already signed in to a college account does not need this form.
  if (user && hasRole(user, COLLEGE_PORTAL_ROLES)) {
    redirect((await collegePortalActive(user)) ? "/college" : "/pending-approval");
  }

  return (
    <PortalLoginShell
      portal="college"
      title="College sign in"
      description="For college administrators, faculty, and accounts staff."
    >
      <LoginForm portal="college" />

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="font-medium text-cyan-700">
          Forgot password?
        </Link>
        <Link href="/register/college" className="font-medium text-cyan-700">
          Register a college
        </Link>
      </div>

      <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
        A newly registered college stays locked out of the dashboard until a platform
        administrator approves the registration. Sign in here once it has been approved to
        open the college portal.
      </p>

      <PortalLoginLinks current="college" />

      <Link href="/" className="btn btn-ghost mt-6">
        Back to home
      </Link>
    </PortalLoginShell>
  );
}
