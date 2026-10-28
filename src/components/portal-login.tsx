import Link from "next/link";
import { Building2, GraduationCap, ShieldCheck } from "lucide-react";
import { clsx } from "@/lib/format";

export type LoginPortal = "student" | "college" | "admin";

const THEME: Record<
  LoginPortal,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tile: string;
    chip: string;
  }
> = {
  student: {
    label: "Student portal",
    icon: GraduationCap,
    tile: "bg-indigo-600",
    chip: "bg-indigo-50 text-indigo-700",
  },
  college: {
    label: "College portal",
    icon: Building2,
    tile: "bg-cyan-600",
    chip: "bg-cyan-50 text-cyan-700",
  },
  admin: {
    label: "Admin portal",
    icon: ShieldCheck,
    tile: "bg-slate-900",
    chip: "bg-slate-100 text-slate-700",
  },
};

const PORTALS: { portal: LoginPortal; href: string }[] = [
  { portal: "student", href: "/login" },
  { portal: "college", href: "/college/login" },
  { portal: "admin", href: "/admin/login" },
];

/**
 * Shared frame for the three sign-in screens. Every portal keeps the same
 * CampusFlow layout while carrying its own identity through the heading tile and
 * the portal chip, so it is always obvious which door you are standing at.
 */
export function PortalLoginShell({
  portal,
  title,
  description,
  children,
}: {
  portal: LoginPortal;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const theme = THEME[portal];
  const Icon = theme.icon;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <div className="card w-full max-w-lg p-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            CampusFlow
          </Link>
          <span className={clsx("rounded-full px-3 py-1 text-xs font-medium", theme.chip)}>
            {theme.label}
          </span>
        </div>

        <div className="mb-6 flex items-start gap-3">
          <span
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white",
              theme.tile,
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}

/** Cross-links so people who opened the wrong portal can move between them. */
export function PortalLoginLinks({ current }: { current: LoginPortal }) {
  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <p className="text-sm font-semibold text-slate-900">Looking for another portal?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PORTALS.filter((item) => item.portal !== current).map((item) => {
          const theme = THEME[item.portal];
          return (
            <Link
              key={item.portal}
              href={item.href}
              className={clsx(
                "rounded-xl px-4 py-2 text-sm font-medium transition",
                theme.chip,
                "hover:brightness-95",
              )}
            >
              {theme.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
