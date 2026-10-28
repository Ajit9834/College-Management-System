import Link from "next/link";
import { clsx } from "@/lib/format";

const LINKS = [
  { href: "/register", label: "Student" },
  { href: "/register/college", label: "College" },
  { href: "/register/admin", label: "Admin" },
];

/** Shared tab strip so the three registration journeys stay discoverable. */
export function RegisterNav({ current }: { current: string }) {
  return (
    <nav className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={clsx(
            "rounded-lg px-3 py-2 text-center text-sm font-medium transition",
            current === link.href
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
