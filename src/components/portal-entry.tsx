import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, ShieldCheck } from "lucide-react";

const STUDY =
  "https://images.pexels.com/photos/6549913/pexels-photo-6549913.jpeg?auto=compress&cs=tinysrgb&w=1200";
const LECTURE =
  "https://images.pexels.com/photos/8197534/pexels-photo-8197534.jpeg?auto=compress&cs=tinysrgb&w=1200";
const LIBRARY =
  "https://images.pexels.com/photos/8199558/pexels-photo-8199558.jpeg?auto=compress&cs=tinysrgb&w=1200";

export const portals = [
  {
    key: "student",
    title: "Student Portal",
    copy: "Profile, timetable, attendance, published results, and fee status at a glance.",
    image: STUDY,
    icon: BookOpen,
    href: "/login",
  },
  {
    key: "college",
    title: "College Portal",
    copy: "Manage students, courses, attendance registers, marks, invoices, and notices.",
    image: LECTURE,
    icon: ClipboardCheck,
    href: "/college/login",
  },
  {
    key: "admin",
    title: "Admin Portal",
    copy: "Create colleges, assign roles, review audit events, and watch platform health.",
    image: LIBRARY,
    icon: ShieldCheck,
    href: "/admin/login",
  },
] as const;

export function PortalEntryCards() {
  return (
    <section id="portals" className="grid gap-5 md:grid-cols-3">
      {portals.map((item) => (
        <article key={item.key} className="card flex flex-col overflow-hidden">
          <img src={item.image} alt="" className="h-40 w-full object-cover" />
          <div className="flex flex-1 flex-col p-5">
            <item.icon className="h-5 w-5 text-indigo-600" />
            <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.copy}</p>
            <Link href={item.href} className="btn btn-primary mt-4 w-full">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
