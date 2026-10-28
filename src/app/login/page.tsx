import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";
import { portalForUser } from "@/lib/permissions";
import { GoogleAuthButton, OrDivider } from "@/components/google-auth-button";
import { LoginForm } from "@/components/login-form";
import { PortalLoginLinks, PortalLoginShell } from "@/components/portal-login";

export const dynamic = "force-dynamic";

const OAUTH_ERRORS: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled.",
  google_failed: "We couldn't complete Google sign-in. Please try again.",
  google_not_configured: "Google sign-in is not configured on this server yet.",
  account_suspended: "This account is suspended or deactivated.",
  account_exists: "An account already exists for that email. Sign in with your password or use Google.",
};

/**
 * Student sign-in. This is also the general entry point: it issues no portal
 * restriction, so a college or administrator account that signs in here is routed
 * to its own dashboard by the server's role mapping.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (user) redirect(portalForUser(user) ?? "/");

  const { error } = await searchParams;
  const oauthError = error ? OAUTH_ERRORS[error] : undefined;

  return (
    <PortalLoginShell
      portal="student"
      title="Student sign in"
      description="Use your CampusFlow student account, or continue with Google."
    >
      <GoogleAuthButton />
      <OrDivider />
      <LoginForm initialError={oauthError} />

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="font-medium text-indigo-600">
          Forgot password?
        </Link>
        <Link href="/register" className="font-medium text-indigo-600">
          Create student account
        </Link>
      </div>

      <PortalLoginLinks current="student" />

      <div className="mt-8 border-t border-slate-200 pt-6">
        <p className="text-sm font-semibold text-slate-900">Need an account instead?</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/register"
            className="rounded-xl border border-slate-200 px-4 py-3 transition hover:border-indigo-300 hover:bg-indigo-50/50"
          >
            <span className="block text-sm font-medium text-slate-900">Student</span>
            <span className="mt-1 block text-xs text-slate-500">
              Register with your college and program
            </span>
          </Link>
          <Link
            href="/register/college"
            className="rounded-xl border border-slate-200 px-4 py-3 transition hover:border-cyan-300 hover:bg-cyan-50/50"
          >
            <span className="block text-sm font-medium text-slate-900">College</span>
            <span className="mt-1 block text-xs text-slate-500">
              Apply to onboard your college
            </span>
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Administrator accounts are provisioned by an existing administrator, not by public
          sign-up.
        </p>
      </div>

      <Link href="/" className="btn btn-ghost mt-6">
        Back to home
      </Link>
    </PortalLoginShell>
  );
}
