import Link from "next/link";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/ui";
import { requireStudentPage } from "@/lib/guard";
import {
  getStudentByUserId,
  listNoticesForUser,
  listStudentAttendance,
  listStudentCourses,
  listStudentFees,
  listStudentResults,
  listStudentTimetable,
  syncOverdueInvoices,
} from "@/lib/data";
import { firstName, formatDate, formatMoney, greeting, percent, todayWeekday, weekdayName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const user = await requireStudentPage();
  const profile = await getStudentByUserId(user.id);
  if (!profile) {
    return <EmptyState title="Profile missing" description="Ask your college office to complete enrollment." />;
  }

  await syncOverdueInvoices(profile.student.collegeId);

  const [courses, timetable, attendance, results, fees, notices] = await Promise.all([
    listStudentCourses(profile.student.id),
    listStudentTimetable(profile.student.id),
    listStudentAttendance(profile.student.id),
    listStudentResults(profile.student.id),
    listStudentFees(profile.student.id),
    listNoticesForUser(user),
  ]);

  const today = timetable.filter((row) => row.weekday === todayWeekday());
  const present = attendance.records.filter((r) => r.status !== "absent").length;
  const attPct = percent(present, attendance.records.length);
  const pendingFee = fees.invoices.find((i) => i.status === "pending" || i.status === "overdue" || i.status === "partially_paid");

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 p-6 text-white shadow-lg shadow-indigo-600/20">
        <p className="text-indigo-100">
          {greeting()}, {firstName(user.fullName)}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {profile.programName} · Semester {profile.student.currentSemester}
        </h1>
        <p className="mt-2 text-sm text-indigo-100">
          {profile.collegeName} · {profile.student.registrationNo}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance" value={`${attPct}%`} hint={`${present} of ${attendance.records.length} sessions`} accent="emerald" />
        <StatCard label="Active courses" value={courses.filter((c) => c.status === "enrolled").length} hint="This semester" />
        <StatCard label="Today's classes" value={today.length} hint={weekdayName(todayWeekday())} accent="cyan" />
        <StatCard
          label="Fee status"
          value={pendingFee ? pendingFee.status.replaceAll("_", " ") : "Clear"}
          hint={pendingFee ? formatMoney(pendingFee.amount) : "No pending invoices"}
          accent={pendingFee ? "amber" : "emerald"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today&apos;s timetable</h2>
            <Link href="/student/timetable" className="text-sm font-medium text-indigo-600">
              View all
            </Link>
          </div>
          {today.length === 0 ? (
            <p className="text-sm text-slate-500">No classes scheduled today.</p>
          ) : (
            <ul className="space-y-3">
              {today.map((row) => (
                <li key={row.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-medium">{row.courseTitle}</p>
                    <p className="text-sm text-slate-500">
                      {row.courseCode} · {row.room} · {row.facultyName ?? "Faculty TBA"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-indigo-700">
                    {row.startsAt}–{row.endsAt}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">Announcements</h2>
          <ul className="space-y-3">
            {notices.slice(0, 4).map((notice) => (
              <li key={notice.id}>
                <p className="font-medium">{notice.title}</p>
                <p className="text-xs text-slate-500">{formatDate(notice.publishedAt)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">Attendance overview</h2>
          <div className="space-y-3">
            {attendance.summary.map((row) => (
              <div key={row.courseCode}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.courseCode}</span>
                  <span>{percent(row.present, row.total)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-indigo-600"
                    style={{ width: `${percent(row.present, row.total)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent results</h2>
            <Link href="/student/results" className="text-sm font-medium text-indigo-600">
              All results
            </Link>
          </div>
          <ul className="space-y-3">
            {results.slice(0, 4).map((row) => (
              <li key={row.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-sm text-slate-500">{row.courseCode}</p>
                </div>
                <StatusBadge status={row.grade ?? "—"} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
