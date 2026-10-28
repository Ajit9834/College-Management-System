import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";
import { portalForUser } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { RegisterNav } from "@/components/register-nav";
import { CollegeRegisterForm } from "@/components/college-register-form";

export const dynamic = "force-dynamic";

export default async function CollegeRegisterPage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (user) redirect(portalForUser(user) ?? "/");

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <div className="card w-full max-w-3xl p-10">
        <div className="mb-6 flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white">
            <Building2 className="h-5 w-5" />
          </span>
          CampusFlow
        </div>
        <PageHeader
          title="Register your college"
          description="Submit your college details for review. A platform administrator approves every new college before the college portal is enabled."
        />
        <RegisterNav current="/register/college" />
        <CollegeRegisterForm />
        <p className="mt-6 text-sm text-slate-600">
          Already have a college account?{" "}
          <Link href="/login" className="font-medium text-indigo-600">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
