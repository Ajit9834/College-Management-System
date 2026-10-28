import { PageHeader, StatCard } from "@/components/ui";
import { requireCollegePage } from "@/lib/guard";
import { collegeDashboardStats, listCollegeStudents } from "@/lib/data";
import { primaryCollegeId } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CollegeReportsPage() {
  const user = await requireCollegePage();
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const [stats, students] = await Promise.all([
    collegeDashboardStats(collegeId),
    listCollegeStudents(collegeId),
  ]);
  const byProgram = students.reduce<Record<string, number>>((acc, s) => {
    acc[s.programName] = (acc[s.programName] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Scoped to your authorized college. No cross-college data is included."
        action={
          <a className="btn btn-ghost" href="/api/v1/college/reports/export">
            Export students CSV
          </a>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={stats.students} />
        <StatCard label="Staff" value={stats.staff} accent="cyan" />
        <StatCard label="Attendance" value={`${stats.attendancePct}%`} accent="emerald" />
        <StatCard label="Unpublished results" value={stats.unpublishedResults} accent="amber" />
      </div>
      <section className="card mt-6 p-5">
        <h2 className="mb-4 font-semibold">Students by program</h2>
        <ul className="space-y-3">
          {Object.entries(byProgram).map(([name, count]) => (
            <li key={name}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{name}</span>
                <span>{count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-indigo-600"
                  style={{ width: `${Math.round((count / Math.max(students.length, 1)) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
