import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { portalForUser } from "@/lib/permissions";
import { ensureSeeded } from "@/db/seed";
import { redirect } from "next/navigation";
import { PortalEntryCards } from "@/components/portal-entry";
import { MarketingNav } from "@/components/marketing-nav";

export const dynamic = "force-dynamic";

const modules = [
  {
    id: "students",
    number: "01",
    title: "Student management",
    detail: "Keep profiles, enrollment, and academic histories connected and easy to find.",
    icon: Users,
    tone: "bg-indigo-50 text-indigo-700",
    href: "/college/login",
  },
  {
    id: "faculty",
    number: "02",
    title: "Faculty workspace",
    detail: "Give teaching teams a clear home for classes, attendance, and assessment work.",
    icon: GraduationCap,
    tone: "bg-violet-50 text-violet-700",
    href: "/college/login",
  },
  {
    id: "academics",
    number: "03",
    title: "Academic planning",
    detail: "Coordinate departments, programs, courses, offerings, and timetables.",
    icon: BookOpen,
    tone: "bg-sky-50 text-sky-700",
    href: "/college/login",
  },
  {
    id: "attendance",
    number: "04",
    title: "Attendance, made clear",
    detail: "Record sessions and follow attendance by student, course, and date.",
    icon: ClipboardCheck,
    tone: "bg-teal-50 text-teal-700",
    href: "/college/login",
  },
  {
    id: "examination",
    number: "05",
    title: "Exams & results",
    detail: "Manage assessment cycles, marks, publication, and student result views.",
    icon: Award,
    tone: "bg-amber-50 text-amber-700",
    href: "/college/login",
  },
  {
    id: "fees",
    number: "06",
    title: "Fees & payments",
    detail: "Track invoices, balances, payment history, and fee receipts in one place.",
    icon: Wallet,
    tone: "bg-emerald-50 text-emerald-700",
    href: "/college/login",
  },
  {
    id: "notices",
    number: "07",
    title: "Notices & events",
    detail: "Share timely announcements with the right campus audience.",
    icon: Megaphone,
    tone: "bg-rose-50 text-rose-700",
    href: "/college/login",
  },
  {
    id: "insights",
    number: "08",
    title: "Campus analytics",
    detail: "Bring enrollment, attendance, academic activity, and operations into view.",
    icon: Activity,
    tone: "bg-cyan-50 text-cyan-700",
    href: "/admin/login",
  },
] as const;

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(portalForUser(user) ?? "/");
  await ensureSeeded();

  return (
    <div className="min-h-screen overflow-hidden">
      <MarketingNav />
      <main>
        <section className="relative isolate overflow-hidden border-b border-indigo-100/70 pb-14 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="marketing-grid absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-36 top-0 -z-10 h-[520px] w-[520px] rounded-full bg-violet-300/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-40 top-28 -z-10 h-[420px] w-[420px] rounded-full bg-cyan-200/20 blur-3xl" aria-hidden="true" />
          <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:px-8">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-sm">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                A calmer way to run campus
              </div>
              <h1 className="mt-6 max-w-2xl text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[4.25rem]">
                Simplifying campus life,
                <span className="text-gradient block">one platform at a time.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                EduSphere brings students, faculty, administrators, and departments into one
                connected campus workspace — from the first class to the final result.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="#dashboard-preview" className="btn btn-primary px-5 py-3">
                  Explore dashboard
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="#platform" className="btn btn-ghost px-5 py-3">
                  Learn more
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Role-based workspaces
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  College-scoped access
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Everyday workflows
                </span>
              </div>
            </div>

            <div id="dashboard-preview" className="relative scroll-mt-28 lg:pl-3">
              <div className="soft-float pointer-events-none absolute -right-3 top-2 z-10 hidden h-24 w-24 rounded-[28px] bg-gradient-to-br from-teal-300 to-cyan-500 opacity-80 blur-[1px] lg:block" aria-hidden="true" />
              <div className="soft-float pointer-events-none absolute -bottom-5 -left-4 z-10 hidden h-20 w-20 rounded-full bg-gradient-to-br from-amber-200 to-orange-400 opacity-80 lg:block" aria-hidden="true" />
              <div className="relative rounded-[30px] border border-white/80 bg-white/70 p-2.5 shadow-[0_35px_90px_rgba(47,45,125,0.18)] backdrop-blur-xl sm:p-3.5">
                <div className="overflow-hidden rounded-[22px] border border-slate-100 bg-[#f7f8fc]">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Building2 className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Campus overview</p>
                        <p className="mt-0.5 text-xs text-slate-500">A glimpse of your workspace</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.65rem] font-bold text-amber-700">
                      SAMPLE DATA
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-5">
                    <div className="rounded-2xl border border-indigo-100/80 bg-white p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Students</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Users className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">2,486</p>
                      <p className="mt-1 text-[0.68rem] text-slate-500">Across active programs</p>
                    </div>
                    <div className="rounded-2xl border border-teal-100/80 bg-white p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Attendance</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                          <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">93.8%</p>
                      <p className="mt-1 text-[0.68rem] text-slate-500">This academic week</p>
                    </div>
                    <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Campus activity</p>
                          <p className="mt-1 text-xs text-slate-500">Illustrative weekly snapshot</p>
                        </div>
                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold text-emerald-700">
                          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                          In view
                        </span>
                      </div>
                      <div className="flex h-28 items-end justify-between gap-2 sm:h-32 sm:gap-3" aria-label="Illustrative campus activity bar chart">
                        {[38, 55, 46, 74, 58, 88, 67].map((height, index) => (
                          <div key={index} className="flex h-full flex-1 items-end justify-center">
                            <div
                              className={`w-full max-w-8 rounded-t-lg ${
                                index === 5
                                  ? "bg-gradient-to-t from-indigo-600 to-violet-400"
                                  : "bg-gradient-to-t from-indigo-100 to-indigo-200"
                              }`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-between text-[0.62rem] font-medium text-slate-400">
                        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                          <span key={index} className="flex-1 text-center">{day}</span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-4 py-3.5 text-white sm:px-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-xs font-bold">Academic calendar</p>
                          <p className="mt-0.5 text-[0.68rem] text-indigo-100">Classes, exams & key dates</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-indigo-100" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-[0.68rem] font-medium text-slate-400">
                Product preview · sample values for illustration
              </p>
            </div>
          </div>
        </section>

        <section id="platform" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-[1320px]">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                One connected campus
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Less busywork. More room to learn.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Bring the day-to-day together with intuitive tools built around the way modern
                colleges work.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {modules.map((item) => (
                <article
                  key={item.id}
                  id={item.id}
                  className="card group scroll-mt-28 overflow-hidden p-5 transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-[0.68rem] font-bold tracking-widest text-slate-300">{item.number}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">{item.title}</h3>
                  <p className="mt-2 min-h-[4.5rem] text-sm leading-6 text-slate-500">{item.detail}</p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 transition group-hover:gap-2.5"
                  >
                    Explore portal
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="analytics" className="scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
          <div className="mx-auto grid max-w-[1320px] gap-8 overflow-hidden rounded-[30px] bg-[#17183d] p-6 text-white shadow-[0_28px_80px_rgba(33,31,91,0.2)] sm:p-9 lg:grid-cols-[0.85fr_1.15fr] lg:p-12">
            <div className="flex flex-col justify-center">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-indigo-200">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                Campus analytics
              </p>
              <h2 className="mt-5 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                See the patterns. Support better outcomes.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-indigo-100/75">
                Turn everyday academic activity into a clearer view of attendance, performance,
                and operations — with access scoped to each role.
              </p>
              <Link href="/admin/login" className="btn mt-6 w-fit border border-white/15 bg-white/10 text-white hover:bg-white/15">
                Explore analytics
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 sm:col-span-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">Attendance trend</p>
                    <p className="mt-1 text-xs text-indigo-200/65">Sample weekly view</p>
                  </div>
                  <span className="rounded-full bg-teal-300/10 px-2.5 py-1 text-[0.65rem] font-bold text-teal-200">
                    ILLUSTRATIVE
                  </span>
                </div>
                <svg
                  viewBox="0 0 540 150"
                  className="mt-5 h-32 w-full overflow-visible"
                  role="img"
                  aria-label="Illustrative line chart showing attendance across six weeks"
                >
                  <defs>
                    <linearGradient id="attendance-line" x1="0" x2="1">
                      <stop offset="0%" stopColor="#67e8f9" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                    <linearGradient id="attendance-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#67e8f9" stopOpacity=".25" />
                      <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[30, 65, 100, 135].map((y) => (
                    <line key={y} x1="0" x2="540" y1={y} y2={y} stroke="white" strokeOpacity=".08" />
                  ))}
                  <path d="M0 112 C42 103 58 86 108 91 S171 114 216 75 S280 83 324 61 S388 77 432 48 S495 54 540 25 L540 150 L0 150 Z" fill="url(#attendance-fill)" />
                  <path d="M0 112 C42 103 58 86 108 91 S171 114 216 75 S280 83 324 61 S388 77 432 48 S495 54 540 25" fill="none" stroke="url(#attendance-line)" strokeLinecap="round" strokeWidth="4" />
                  <circle cx="540" cy="25" r="5" fill="#a78bfa" stroke="white" strokeWidth="3" />
                </svg>
                <div className="mt-2 flex justify-between text-[0.65rem] text-indigo-200/55">
                  {["W1", "W2", "W3", "W4", "W5", "W6"].map((week) => <span key={week}>{week}</span>)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5">
                <p className="text-sm font-semibold">Department mix</p>
                <p className="mt-1 text-xs text-indigo-200/65">Example distribution</p>
                <div className="mt-5 flex items-center gap-4">
                  <div
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "conic-gradient(#67e8f9 0 34%, #a78bfa 34% 64%, #fbbf24 64% 82%, #fb7185 82% 100%)" }}
                    role="img"
                    aria-label="Illustrative pie chart of department distribution"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#242448] text-[0.62rem] font-bold text-white">
                      SAMPLE
                    </span>
                  </div>
                  <div className="space-y-2 text-[0.68rem] text-indigo-100/75">
                    {[["bg-cyan-300", "Engineering"], ["bg-violet-300", "Sciences"], ["bg-amber-300", "Business"], ["bg-rose-300", "Arts"]].map(([color, label]) => (
                      <p key={label} className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${color}`} />
                        {label}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5">
                <p className="text-sm font-semibold">Weekly activity</p>
                <p className="mt-1 text-xs text-indigo-200/65">Example campus pulse</p>
                <div className="mt-5 flex h-[6.25rem] items-end gap-2">
                  {[42, 64, 51, 82, 58, 94, 72].map((height, index) => (
                    <span
                      key={index}
                      className={`flex-1 rounded-t-md ${index === 5 ? "bg-gradient-to-t from-teal-400 to-cyan-200" : "bg-white/15"}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[0.62rem] text-indigo-200/55">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={index}>{day}</span>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
          <div className="mx-auto max-w-[1320px]">
            <PortalEntryCards />
          </div>
        </section>

        <section className="border-y border-indigo-100/70 bg-white/65 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-xl font-semibold tracking-tight text-slate-900">
                Ready to bring your campus together?
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Start in the portal built for your role.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/login" className="btn btn-primary">
                Student sign in
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/college/login" className="btn btn-ghost">
                College portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 py-9 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white">
              <GraduationCap className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="font-bold tracking-tight text-slate-900">EduSphere</span>
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500" aria-label="Footer navigation">
            <Link href="#platform" className="hover:text-indigo-600">Platform</Link>
            <Link href="#analytics" className="hover:text-indigo-600">Analytics</Link>
            <Link href="#portals" className="hover:text-indigo-600">Portals</Link>
            <Link href="/register" className="hover:text-indigo-600">Register</Link>
            <Link href="/login" className="hover:text-indigo-600">Sign in</Link>
          </nav>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} EduSphere</p>
        </div>
      </footer>
    </div>
  );
}
