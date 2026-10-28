import Link from "next/link";
import { PageHeader, StatCard } from "@/components/ui";
import { requireCollegePage } from "@/lib/guard";
import { collegeDashboardStats, listCollegeStudents, listNoticesForUser } from "@/lib/data";
import { primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { assessments, colleges } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { formatDate } from "@/lib/format";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CollegeDashboard() {
  const user = await requireCollegePage();
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");

  const [stats, college, students, notices, drafts] = await Promise.all([
    collegeDashboardStats(collegeId),
    db.select().from(colleges).where(eq(colleges.id, collegeId)).then((rows) => rows[0]),
    listCollegeStudents(collegeId),
    listNoticesForUser(user),
    db
      .select()
      .from(assessments)
      .where(and(eq(assessments.collegeId, collegeId), eq(assessments.publishStatus, "draft")))
      .orderBy(desc(assessments.createdAt))
      .limit(5),
  ]);

  return (
    <div>
      <PageHeader
        title={college?.name ?? "College overview"}
        description="Operational snapshot for your authorized college only."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/college/students" className="btn btn-primary">
              Add student
            </Link>
            <Link href="/college/attendance" className="btn btn-secondary">
              Mark attendance
            </Link>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active students" value={stats.students} />
        <StatCard label="Staff" value={stats.staff} accent="cyan" />
        <StatCard label="Course offerings" value={stats.offerings} accent="amber" />
        <StatCard label="Attendance" value={`${stats.attendancePct}%`} hint="Marked sessions" accent="emerald" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">Pending tasks</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between rounded-xl bg-amber-50 px-4 py-3">
              <span>Unpublished assessments</span>
              <strong>{stats.unpublishedResults}</strong>
            </li>
            <li className="flex justify-between rounded-xl bg-rose-50 px-4 py-3">
              <span>Overdue fee invoices</span>
              <strong>{stats.overdueFees}</strong>
            </li>
            {drafts.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.title}</span>
                <Link href="/college/results" className="text-indigo-600">
                  Review
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">Recent students</h2>
          <ul className="space-y-3">
            {students.slice(0, 6).map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{s.fullName}</p>
                  <p className="text-slate-500">{s.registrationNo}</p>
                </div>
                <span className="text-slate-500">{s.programName}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="card mt-6 p-5">
        <h2 className="mb-4 text-lg font-semibold">Latest notices</h2>
        <ul className="space-y-2 text-sm">
          {notices.slice(0, 5).map((n) => (
            <li key={n.id} className="flex justify-between gap-4">
              <span className="font-medium">{n.title}</span>
              <span className="text-slate-500">{formatDate(n.publishedAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
