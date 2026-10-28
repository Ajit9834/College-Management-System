import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/ui";
import { JsonForm, ConfirmButton, UploadField } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { getStudentById, listStudentAttendance, listStudentCourses, listStudentFees, listStudentResults, listUploadNames } from "@/lib/data";
import { canAccessCollege, canManageStudents } from "@/lib/permissions";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CollegeStudentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCollegePage();
  const { id } = await params;
  const row = await getStudentById(id);
  if (!row || !canAccessCollege(user, row.student.collegeId)) notFound();

  const [courses, attendance, results, fees] = await Promise.all([
    listStudentCourses(row.student.id),
    listStudentAttendance(row.student.id),
    listStudentResults(row.student.id),
    listStudentFees(row.student.id),
  ]);
  const photoNames = row.student.photoId
    ? await listUploadNames([row.student.photoId])
    : {};

  return (
    <div>
      <PageHeader
        title={row.userName}
        description={`${row.student.registrationNo} · ${row.programName}`}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusBadge status={row.student.status} />
        <StatusBadge status={`Semester ${row.student.currentSemester}`} />
      </div>
      <section className="card mb-6 p-5">
        <h2 className="mb-4 font-semibold">Profile photo</h2>
        {row.student.photoId ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/v1/uploads/${row.student.photoId}`}
            alt={`${row.userName} profile photo`}
            className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
          />
        ) : (
          <p className="text-sm text-slate-500">No photo on file.</p>
        )}
        {canManageStudents(user) ? (
          <div className="mt-4">
            <JsonForm
              action={`/api/v1/college/students/${row.student.id}`}
              method="PATCH"
              submitLabel="Save photo"
              successMessage="Photo updated."
            >
              <UploadField
                name="photoId"
                label="Upload a new photo (PNG/JPG/WebP, max 5 MB)"
                accept="image/png,image/jpeg,image/webp"
                defaultValue={row.student.photoId ?? undefined}
                defaultFileName={
                  row.student.photoId ? photoNames[row.student.photoId] ?? "current photo" : null
                }
              />
            </JsonForm>
          </div>
        ) : null}
      </section>
      {canManageStudents(user) ? (
        <section className="card mb-6 p-5">
          <h2 className="mb-4 font-semibold">Update enrollment</h2>
          <JsonForm action={`/api/v1/college/students/${row.student.id}`} method="PATCH">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="label" htmlFor="currentSemester">Semester</label>
                <input id="currentSemester" name="currentSemester" type="number" className="input" defaultValue={row.student.currentSemester} />
              </div>
              <div>
                <label className="label" htmlFor="status">Status</label>
                <select id="status" name="status" className="select" defaultValue={row.student.status}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="academicYear">Academic year</label>
                <input id="academicYear" name="academicYear" className="input" defaultValue={row.student.academicYear} />
              </div>
            </div>
          </JsonForm>
        </section>
      ) : null}
      <section className="card mb-6 p-5">
        <h2 className="mb-2 font-semibold">Documents</h2>
        <p className="mb-4 text-sm text-slate-500">
          Generate printable PDF documents for this student.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            className="btn btn-secondary"
            href={`/api/v1/college/students/${row.student.id}/transcript`}
            target="_blank"
            rel="noreferrer"
          >
            Transcript (PDF)
          </a>
          <a
            className="btn btn-secondary"
            href={`/api/v1/college/students/${row.student.id}/report-card`}
            target="_blank"
            rel="noreferrer"
          >
            Report card (PDF)
          </a>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Courses</h2>
          <ul className="space-y-2 text-sm">
            {courses.map((c) => (
              <li key={c.enrollmentId}>
                {c.courseCode} · {c.courseTitle}
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Fees</h2>
          <ul className="space-y-2 text-sm">
            {fees.invoices.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>{i.title}</span>
                <span>
                  {formatMoney(i.amount)} · {i.status.replaceAll("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Attendance sessions</h2>
          <p className="text-sm text-slate-600">{attendance.records.length} records on file.</p>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Published results</h2>
          <ul className="space-y-2 text-sm">
            {results.map((r) => (
              <li key={r.id}>
                {r.title}: {r.marks}/{r.maxMarks} ({r.grade})
              </li>
            ))}
          </ul>
        </section>
      </div>
      {canManageStudents(user) ? (
        <section className="card mt-6 max-w-2xl border-rose-200 p-5">
          <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
          <p className="mb-4 text-sm text-slate-500">
            Permanently removes this student, their enrollments, attendance, results, fee records,
            and login. This cannot be undone.
          </p>
          <ConfirmButton
            action={`/api/v1/college/students/${row.student.id}`}
            method="DELETE"
            variant="danger"
            label="Delete student"
            confirmText="Delete this student and all their records permanently? This cannot be undone."
            redirectTo="/college/students"
          />
        </section>
      ) : null}
    </div>
  );
}
