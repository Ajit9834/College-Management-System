"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { AuthUser } from "@/lib/permissions";
import { roleLabel } from "@/lib/permissions";
import { clsx, initials } from "@/lib/format";

export type NavIconName =
  | "dashboard"
  | "approvals"
  | "students"
  | "building"
  | "courses"
  | "users"
  | "timetable"
  | "attendance"
  | "results"
  | "fees"
  | "wallet"
  | "notices"
  | "reports"
  | "settings";

// Server Components pass NavItem[] into this Client Component, so icons are
// referenced by name: component functions are not serializable across that boundary.
const NAV_ICONS: Record<NavIconName, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  approvals: ShieldCheck,
  students: GraduationCap,
  building: Building2,
  courses: BookOpen,
  users: Users,
  timetable: CalendarDays,
  attendance: ClipboardCheck,
  results: ScrollText,
  fees: CreditCard,
  wallet: Wallet,
  notices: Bell,
  reports: Shield,
  settings: Settings,
};

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
};

export function AppShell({
  user,
  nav,
  portalLabel,
  children,
}: {
  user: AuthUser;
  nav: NavItem[];
  portalLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const role = user.roles[0]?.role;
  const settingsHref = nav.find((item) => item.icon === "settings")?.href;
  const noticesHref = nav.find((item) => item.icon === "notices")?.href;

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const aside = (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 text-white shadow-lg shadow-indigo-950/30">
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold tracking-tight text-white">EduSphere</p>
          <p className="mt-0.5 text-xs text-indigo-200">{portalLabel}</p>
        </div>
      </div>
      <div className="px-5 pb-3 pt-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-indigo-300/75">
        Workspace
      </div>
      <nav className="flex-1 space-y-1 px-3 pb-5" aria-label={`${portalLabel} navigation`}>
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (!["/student", "/college", "/admin"].includes(item.href) &&
              pathname.startsWith(`${item.href}/`));
          const Icon = NAV_ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                setOpen(false);
                setNotificationsOpen(false);
              }}
              className={clsx(
                "app-sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                active && "shadow-inner",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-300/15 text-sm font-bold text-indigo-100">
            {initials(user.fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
            <p className="truncate text-xs text-indigo-200">
              {role ? roleLabel(role) : "User"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[0.7rem] text-indigo-200/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
          Secure, role-based workspace
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-3 text-[0.7rem] text-indigo-300/70">
        EduSphere · Campus operations
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside
        className="app-sidebar app-sidebar-scroll fixed inset-y-0 left-0 z-30 hidden w-[268px] overflow-y-auto lg:block"
        data-lenis-prevent
      >
        {aside}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside
            className="app-sidebar app-sidebar-scroll relative h-full w-[min(88vw,300px)] overflow-y-auto shadow-2xl"
            data-lenis-prevent
          >
            {aside}
          </aside>
        </div>
      ) : null}
      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-[#f7f8fc]/85 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-[1500px] items-center gap-3">
            <button
              className="btn btn-ghost h-10 w-10 p-0 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-indigo-500">
                {portalLabel}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                Your campus, in sync
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <button
                  type="button"
                  className="btn btn-ghost btn-icon relative"
                  aria-label="Open notifications"
                  aria-expanded={notificationsOpen}
                  aria-controls="notification-center"
                  onClick={() => setNotificationsOpen((value) => !value)}
                >
                  <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
                {notificationsOpen ? (
                  <div
                    id="notification-center"
                    className="card absolute right-0 top-12 z-30 w-[min(88vw,320px)] p-4"
                    role="region"
                    aria-label="Notification center"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Bell className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">Notification center</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Notices and academic updates for your portal are collected here.
                        </p>
                      </div>
                    </div>
                    {noticesHref ? (
                      <Link
                        href={noticesHref}
                        className="btn btn-secondary mt-4 w-full"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        Open notices
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1.5 transition hover:bg-white [&::-webkit-details-marker]:hidden">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-md shadow-indigo-500/20">
                    {initials(user.fullName)}
                  </span>
                  <span className="hidden max-w-36 text-left sm:block">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {user.fullName}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {role ? roleLabel(role) : "User"}
                    </span>
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" aria-hidden="true" />
                </summary>
                <div className="card absolute right-0 top-12 z-30 w-64 p-2">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  {settingsHref ? (
                    <Link
                      href={settingsHref}
                      className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Settings className="h-4 w-4" aria-hidden="true" />
                      Account settings
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </details>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
