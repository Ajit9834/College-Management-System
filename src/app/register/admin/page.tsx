import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";
import { portalForUser } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { RegisterNav } from "@/components/register-nav";

export const dynamic = "force-dynamic";

/**
 * Admin accounts are never self-service. This page intentionally renders no
 * registration form and holds no invitation code or secret: allowing a public
 * form to mint platform administrators would hand the whole platform to anyone
 * who found the URL. Provisioning happens through an existing administrator.
 */
export default async function AdminRegisterPage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (user) redirect(portalForUser(user) ?? "/");

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <div className="card w-full max-w-3xl p-10">
        <div className="mb-6 flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          CampusFlow
        </div>
        <PageHeader
          title="Administrator access"
          description="Platform administrator accounts are provisioned internally and cannot be created from a public registration form."
        />
        <RegisterNav current="/register/admin" />

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-5 w-5" />
            Self-registration is not available for administrators
          </div>
          <p className="mt-2">
            To keep the platform secure, CampusFlow never grants the platform administrator
            role from a public form, and it does not expose an invitation code or any
            server credentials in the browser.
          </p>
        </div>

        <div className="mt-6 space-y-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">
            How administrator accounts are created
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              An existing platform administrator signs in and opens{" "}
              <span className="font-medium">Admin → Users &amp; Roles</span> to create the
              account and assign the Platform Admin role.
            </li>
            <li>
              The initial administrator for a fresh deployment is provisioned
              server-side during setup, never through this page.
            </li>
            <li>
              Colleges are onboarded through{" "}
              <Link href="/register/college" className="font-medium text-indigo-600">
                college registration
              </Link>{" "}
              and then approved by an administrator.
            </li>
          </ul>
          <p>
            If you believe you need administrator access, contact the platform owner or an
            existing administrator.
          </p>
        </div>

        <p className="mt-6 text-sm text-slate-600">
          Already an administrator?{" "}
          <Link href="/login" className="font-medium text-indigo-600">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
