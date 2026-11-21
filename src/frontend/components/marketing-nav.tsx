"use client";

import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { label: "Dashboard", href: "#dashboard-preview" },
  { label: "Students", href: "#students" },
  { label: "Faculty", href: "#faculty" },
  { label: "Academics", href: "#academics" },
  { label: "Attendance", href: "#attendance" },
  { label: "Examination", href: "#examination" },
  { label: "Fees", href: "#fees" },
  { label: "Notices", href: "#notices" },
  { label: "Analytics", href: "#analytics" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-indigo-100/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="EduSphere home">
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-indigo-600 via-violet-600 to-teal-500 text-white shadow-lg shadow-indigo-500/20">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-[1.05rem] font-bold tracking-tight text-slate-900">
              EduSphere
            </span>
            <span className="hidden text-[0.65rem] font-medium tracking-wide text-slate-500 sm:block">
              CAMPUS MANAGEMENT
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-3 xl:flex" aria-label="Main navigation">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="whitespace-nowrap rounded-lg px-1.5 py-2 text-[0.72rem] font-semibold text-slate-600 transition hover:text-indigo-600"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-3">
          <Link
            href="/login"
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary px-4 py-2.5 text-xs sm:text-sm">
            Get started
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-icon xl:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-marketing-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-marketing-navigation"
          className="border-t border-indigo-100 bg-white px-4 py-3 shadow-xl shadow-indigo-950/5 xl:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-1 sm:grid-cols-4">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              Create account
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
