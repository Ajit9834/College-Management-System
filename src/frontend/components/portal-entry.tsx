import Link from "next/link";
import { ArrowRight, BookOpen, Building2, ShieldCheck, Sparkles } from "lucide-react";

export const portals = [
  {
    key: "student",
    title: "Student Portal",
    copy: "Profile, timetable, attendance, published results, and fee status at a glance.",
    icon: BookOpen,
    href: "/login",
    tone: "from-indigo-600 via-violet-600 to-purple-500",
    audience: "For students",
  },
  {
    key: "college",
    title: "College Portal",
    copy: "Manage students, courses, attendance registers, marks, invoices, and notices.",
    icon: Building2,
    href: "/college/login",
    tone: "from-teal-600 via-cyan-600 to-blue-500",
    audience: "For faculty & staff",
  },
  {
    key: "admin",
    title: "Admin Portal",
    copy: "Create colleges, assign roles, review audit events, and watch platform health.",
    icon: ShieldCheck,
    href: "/admin/login",
    tone: "from-slate-800 via-indigo-900 to-violet-800",
    audience: "For administrators",
  },
] as const;

export function PortalEntryCards() {
  return (
    <section id="portals" className="scroll-mt-28">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            One platform, every role
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Your campus. Your workspace.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-500">
          Purpose-built portals keep every person focused on the work that matters to them.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {portals.map((item, index) => (
          <article
            key={item.key}
            className="card group flex flex-col overflow-hidden border-white/80 transition duration-200 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className={`relative isolate overflow-hidden bg-gradient-to-br ${item.tone} p-6 text-white`}>
              <div aria-hidden="true" className="absolute -right-7 -top-14 h-44 w-44 rounded-full border border-white/20" />
              <div aria-hidden="true" className="absolute -right-2 -top-9 h-32 w-32 rounded-full border border-white/15" />
              <div aria-hidden="true" className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold tracking-wide text-white/75">
                  0{index + 1} / PORTAL
                </span>
              </div>
              <div className="relative mt-8 flex items-center gap-2 text-xs font-semibold text-white/80">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {item.audience}
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{item.copy}</p>
              <Link
                href={item.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition group-hover:gap-3"
              >
                Sign in to your portal
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
