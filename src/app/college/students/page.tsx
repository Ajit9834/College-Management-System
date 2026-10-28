import Link from "next/link";
import { EmptyState, PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { CsvImportForm, JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { pageCollegeStudents } from "@/lib/data";
import { normalizePagination } from "@/lib/pagination";
import { canManageStudents, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { departments, programs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CollegeStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireCollegePage();
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { q, page: pageParam } = await searchParams;
  const { page, pageSize, offset } = normalizePagination({ page: pageParam });
  const [{ rows, total }, depts, progs] = await Promise.all([
    pageCollegeStudents(collegeId, { q, limit: pageSize, offset }),
    db.select().from(departments).where(eq(departments.collegeId, collegeId)),
    db.select().from(programs).where(eq(programs.collegeId, collegeId)),
  ]);
  const canManage = canManageStudents(user);

  return (
    <div>
      <PageHeader title="Students" description="Search and manage student records in your college." />
      <form className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input className="input max-w-sm" name="q" placeholder="Search name, email, or registration" defaultValue={q} />
        <button className="btn btn-ghost" type="submit">
          Search
        </button>
      </form>
      {canManage ? (
        <>
        <section className="card mb-6 p-5">
          <h2 className="mb-4 font-semibold">Create student</h2>
          <JsonForm action="/api/v1/college/students" submitLabel="Create student">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label" htmlFor="fullName">Full name</label>
                <input id="fullName" name="fullName" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="registrationNo">Registration no.</label>
                <input id="registrationNo" name="registrationNo" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="departmentId">Department</label>
                <select id="departmentId" name="departmentId" className="select" required>
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="programId">Program</label>
                <select id="programId" name="programId" className="select" required>
                  {progs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="currentSemester">Semester</label>
                <input id="currentSemester" name="currentSemester" type="number" min={1} defaultValue={1} className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="academicYear">Academic year</label>
                <input id="academicYear" name="academicYear" className="input" defaultValue="2025-2026" required />
              </div>
              <div>
                <label className="label" htmlFor="password">Temporary password</label>
                <input id="password" name="password" className="input" defaultValue="StudentPass!23" />
              </div>
            </div>
          </JsonForm>
        </section>
        <section className="card mb-6 p-5">
          <h2 className="mb-1 font-semibold">Bulk import students</h2>
          <p className="mb-4 text-sm text-slate-500">
            CSV header row: fullName, email, registrationNo, departmentCode, programCode, currentSemester,
            academicYear. Optional: phone, password, dateOfBirth, gender, address, emergencyContact, status.
          </p>
          <CsvImportForm
            action="/api/v1/college/students/import"
            submitLabel="Import students"
            hint="Department and program codes must already exist in your college."
          />
        </section>
        </>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title="No students found" description="Try another search or create a student record." />
      ) : (
        <>
          <div className="table-wrap card">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Registration</th>
                  <th>Program</th>
                  <th>Sem</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <p className="font-medium">{row.fullName}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td>{row.registrationNo}</td>
                    <td>{row.programName}</td>
                    <td>{row.currentSemester}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>
                      <Link href={`/college/students/${row.id}`} className="text-sm font-medium text-indigo-600">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            basePath="/college/students"
            params={{ q }}
            page={page}
            pageSize={pageSize}
            total={total}
          />
        </>
      )}
    </div>
  );
}
