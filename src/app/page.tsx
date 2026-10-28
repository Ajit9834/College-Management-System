import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { portalForUser } from "@/lib/permissions";
import { ensureSeeded } from "@/db/seed";
import { redirect } from "next/navigation";
import { PortalEntryCards } from "@/components/portal-entry";

export const dynamic = "force-dynamic";

const HERO =
  "https://images.pexels.com/photos/36078146/pexels-photo-36078146.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default async function HomePage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (user) redirect(portalForUser(user) ?? "/");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          CampusFlow
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/register"
            className="font-medium text-slate-600 hover:text-indigo-600"
          >
            Register
          </Link>
          <Link href="/login" className="font-medium text-indigo-600">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <section className="grid items-center gap-10 py-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
              College management, simplified
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              One platform for students, colleges, and administrators.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              CampusFlow centralizes enrollment, attendance, results, fees, and notices with
              strict role-based access and a calm, modern academic workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="btn btn-primary">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-ghost">
                Create student account
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-2xl">
            <img src={HERO} alt="Aerial view of a modern university campus" className="h-[360px] w-full object-cover" />
          </div>
        </section>

        <PortalEntryCards />
      </main>
    </div>
  );
}
