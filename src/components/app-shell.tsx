"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
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
  const role = user.roles[0]?.role;

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const aside = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold tracking-tight">CampusFlow</p>
          <p className="text-xs text-slate-500">{portalLabel}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/student" &&
              item.href !== "/college" &&
              item.href !== "/admin" &&
              pathname.startsWith(item.href));
          const Icon = NAV_ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {initials(user.fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="truncate text-xs text-slate-500">
              {role ? roleLabel(role) : "User"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {aside}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-72 bg-white shadow-2xl">{aside}</aside>
        </div>
      ) : null}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <button
            className="btn btn-ghost lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <p className="hidden text-sm text-slate-500 sm:block">
            Academic operations, attendance, results, and notices in one place.
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn btn-ghost" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <Link className="btn btn-ghost" href={`${nav[0]?.href ?? "/"}/settings`.replace("//", "/")}>
              <Settings className="h-4 w-4" />
            </Link>
            <button className="btn btn-ghost" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
