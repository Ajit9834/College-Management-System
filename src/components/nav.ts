import type { NavItem } from "@/components/app-shell";

export const studentNav: NavItem[] = [
  { href: "/student", label: "Overview", icon: "dashboard" },
  { href: "/student/profile", label: "My Profile", icon: "users" },
  { href: "/student/courses", label: "My Courses", icon: "courses" },
  { href: "/student/timetable", label: "Timetable", icon: "timetable" },
  { href: "/student/attendance", label: "Attendance", icon: "attendance" },
  { href: "/student/results", label: "Results", icon: "results" },
  { href: "/student/fees", label: "Fees", icon: "wallet" },
  { href: "/student/notices", label: "Notices", icon: "notices" },
  { href: "/student/settings", label: "Settings", icon: "settings" },
];

export const collegeNav: NavItem[] = [
  { href: "/college", label: "Overview", icon: "dashboard" },
  { href: "/college/students", label: "Students", icon: "students" },
  { href: "/college/departments", label: "Departments", icon: "building" },
  { href: "/college/courses", label: "Courses", icon: "courses" },
  { href: "/college/enrollments", label: "Enrollments", icon: "users" },
  { href: "/college/timetable", label: "Timetable", icon: "timetable" },
  { href: "/college/attendance", label: "Attendance", icon: "attendance" },
  { href: "/college/results", label: "Results", icon: "results" },
  { href: "/college/fees", label: "Fees", icon: "fees" },
  { href: "/college/notices", label: "Notices", icon: "notices" },
  { href: "/college/reports", label: "Reports", icon: "reports" },
  { href: "/college/settings", label: "College Settings", icon: "settings" },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/approvals", label: "Approvals", icon: "approvals" },
  { href: "/admin/colleges", label: "Colleges", icon: "building" },
  { href: "/admin/users", label: "Users & Roles", icon: "users" },
  { href: "/admin/audit", label: "Audit Logs", icon: "reports" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/settings", label: "Platform Settings", icon: "settings" },
];
