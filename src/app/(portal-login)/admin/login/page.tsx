import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/permissions";
import { LoginForm } from "@/components/login-form";
import { PortalLoginLinks, PortalLoginShell } from "@/components/portal-login";

export const dynamic = "force-dynamic";

/**
 * Administrator sign-in.
 *
 * Lives in the `(portal-login)` route group so it escapes `app/admin/layout.tsx`,
 * which would otherwise send anonymous visitors away before the form could render.
 * The form posts `portal: "admin"`, and the login endpoint refuses to issue a
 * session unless the account genuinely holds the platform_admin role.
 */
export default async function AdminLoginPage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  // Only a real administrator is redirected straight through.
  if (user && isPlatformAdmin(user)) redirect("/admin");

  return (
    <PortalLoginShell
      portal="admin"
      title="Administrator sign in"
      description="Platform administrators only. Your role is verified on the server."
    >
      <LoginForm portal="admin" />

      <div className="mt-6 text-sm">
        <Link href="/forgot-password" className="font-medium text-slate-700">
          Forgot password?
        </Link>
      </div>

      <p className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-600">
        Administrator accounts are provisioned by an existing administrator from{" "}
        <span className="font-medium text-slate-900">Admin → Users &amp; Roles</span>. There is
        no public admin registration: valid credentials alone are not enough, the account must
        hold the platform administrator role.
      </p>

      <PortalLoginLinks current="admin" />

      <Link href="/" className="btn btn-ghost mt-6">
        Back to home
      </Link>
    </PortalLoginShell>
  );
}
