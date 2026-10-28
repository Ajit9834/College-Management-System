import Link from "next/link";
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
    indigo: "from-indigo-500/15 to-transparent",
    cyan: "from-cyan-500/15 to-transparent",
    amber: "from-amber-500/18 to-transparent",
    emerald: "from-emerald-500/15 to-transparent",
    rose: "from-rose-500/15 to-transparent",
  };
  return (
    <div className={clsx("card relative overflow-hidden p-5", "bg-gradient-to-br", tones[accent])}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
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
