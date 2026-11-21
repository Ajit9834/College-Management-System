import Link from "next/link";
import {
  Activity,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Users,
  Wallet,
} from "lucide-react";
import { clsx } from "@/lib/format";
import { buildPageHref, totalPages } from "@/lib/pagination";
import type { ReactNode } from "react";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    published: "bg-emerald-50 text-emerald-700",
    paid: "bg-emerald-50 text-emerald-700",
    present: "bg-emerald-50 text-emerald-700",
    enrolled: "bg-emerald-50 text-emerald-700",
    completed: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-800",
    draft: "bg-amber-50 text-amber-800",
    late: "bg-amber-50 text-amber-800",
    partially_paid: "bg-amber-50 text-amber-800",
    scheduled: "bg-sky-50 text-sky-800",
    staff: "bg-sky-50 text-sky-800",
    students: "bg-indigo-50 text-indigo-700",
    all: "bg-slate-100 text-slate-700",
    inactive: "bg-slate-100 text-slate-600",
    archived: "bg-slate-100 text-slate-600",
    withdrawn: "bg-slate-100 text-slate-600",
    cancelled: "bg-slate-100 text-slate-600",
    suspended: "bg-rose-50 text-rose-700",
    rejected: "bg-rose-50 text-rose-700",
    overdue: "bg-rose-50 text-rose-700",
    absent: "bg-rose-50 text-rose-700",
    deactivated: "bg-rose-50 text-rose-700",
    excused: "bg-cyan-50 text-cyan-800",
    graduated: "bg-violet-50 text-violet-700",
  };
  return (
    <span className={clsx("badge", map[status] ?? "bg-slate-100 text-slate-700")}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "indigo" | "cyan" | "amber" | "emerald" | "rose";
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700",
    cyan: "bg-cyan-50 text-cyan-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };
  const statIcons: Record<string, typeof Activity> = {
    Colleges: Building2,
    "Active users": Users,
    Users,
    "Active students": GraduationCap,
    Students: GraduationCap,
    Staff: Users,
    "Pending approvals": CheckCircle2,
    "Unpublished results": ClipboardCheck,
    Attendance: Activity,
    Overall: Activity,
    Sessions: CalendarDays,
    "Today's classes": CalendarDays,
    "Active courses": BookOpen,
    "Course offerings": BookOpen,
    "Courses tracked": BookOpen,
    Invoices: CreditCard,
    Outstanding: Wallet,
    "Payments recorded": CreditCard,
  };
  const Icon = statIcons[label] ?? Activity;

  return (
    <div className="card group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl">
      <div
        aria-hidden="true"
        className={clsx(
          "pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl",
          tones[accent],
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", tones[accent])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <div className="relative mt-4 flex min-h-5 items-center justify-between gap-3">
        {hint ? <p className="text-sm text-slate-500">{hint}</p> : <span />}
        <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-500">
          Snapshot
        </span>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-rose-600">{children}</p>;
}

export function Pagination({
  basePath,
  params = {},
  page,
  pageSize,
  total,
}: {
  basePath: string;
  params?: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const pages = totalPages(total, pageSize);
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        {total === 0
          ? "No results."
          : `Showing ${first}–${last} of ${total} ${total === 1 ? "result" : "results"}.`}
      </p>
      {pages > 1 ? (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link className="btn btn-ghost" href={buildPageHref(basePath, params, page - 1)}>
              Previous
            </Link>
          ) : (
            <span className="btn btn-ghost pointer-events-none opacity-40">Previous</span>
          )}
          <span className="px-2 text-sm text-slate-500">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link className="btn btn-ghost" href={buildPageHref(basePath, params, page + 1)}>
              Next
            </Link>
          ) : (
            <span className="btn btn-ghost pointer-events-none opacity-40">Next</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
