import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmButton, JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canRecordAttendance, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { attendanceRecords, attendanceSessions, courseOfferings, courses, students, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AttendanceSessionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCollegePage(["college_admin", "faculty"]);
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { id } = await params;
  const [row] = await db
    .select({
      id: attendanceSessions.id,
      offeringId: attendanceSessions.offeringId,
      sessionDate: attendanceSessions.sessionDate,
      topic: attendanceSessions.topic,
      courseCode: courses.code,
      courseTitle: courses.title,
    })
    .from(attendanceSessions)
    .innerJoin(courseOfferings, eq(courseOfferings.id, attendanceSessions.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(and(eq(attendanceSessions.id, id), eq(attendanceSessions.collegeId, collegeId)))
    .limit(1);
  if (!row) notFound();

  const records = await db
    .select({
      id: attendanceRecords.id,
      status: attendanceRecords.status,
      notes: attendanceRecords.notes,
      studentName: users.fullName,
      registrationNo: students.registrationNo,
    })
    .from(attendanceRecords)
    .innerJoin(students, eq(students.id, attendanceRecords.studentId))
    .innerJoin(users, eq(users.id, students.userId))
    .where(eq(attendanceRecords.sessionId, row.id))
    .orderBy(users.fullName);

  return (
    <div>
      <PageHeader
        title="Attendance session"
        description={`${row.courseCode} · ${row.courseTitle}`}
      />
      <Link href="/college/attendance" className="mb-4 inline-block text-sm text-indigo-600">
        ← Back to attendance
      </Link>
      {canRecordAttendance(user) ? (
        <section className="card max-w-2xl p-5">
          <h2 className="mb-4 font-semibold">Edit session</h2>
          <JsonForm
            action={`/api/v1/college/attendance/sessions/${row.id}`}
            method="PATCH"
            submitLabel="Save changes"
            successMessage="Attendance session updated."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="sessionDate">Session date</label>
                <input
                  id="sessionDate"
                  name="sessionDate"
                  type="date"
                  className="input"
                  defaultValue={row.sessionDate}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="topic">Topic</label>
                <input id="topic" name="topic" className="input" defaultValue={row.topic ?? ""} />
              </div>
            </div>
          </JsonForm>
        </section>
      ) : (
        <p className="text-sm text-slate-500">You do not have permission to edit attendance.</p>
      )}
      <section className="card mt-6 max-w-2xl p-5">
        <h2 className="mb-3 font-semibold">Marked records ({records.length})</h2>
        <ul className="space-y-2 text-sm">
          {records.map((record) => (
            <li key={record.id} className="flex items-center justify-between gap-3">
              <span>
                {record.studentName} · {record.registrationNo}
              </span>
              <span className="flex items-center gap-3">
                <StatusBadge status={record.status} />
                {canRecordAttendance(user) ? (
                  <ConfirmButton
                    action={`/api/v1/college/attendance/sessions/${row.id}/records/${record.id}`}
                    method="DELETE"
                    variant="danger"
                    label="Remove"
                    confirmText={`Remove the attendance record for ${record.studentName}?`}
                  />
                ) : null}
              </span>
            </li>
          ))}
          {records.length === 0 ? (
            <li className="text-slate-500">No students marked for this session yet.</li>
          ) : null}
        </ul>
      </section>
      {canRecordAttendance(user) ? (
        <section className="card mt-6 max-w-2xl border-rose-200 p-5">
          <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
          <p className="mb-4 text-sm text-slate-500">
            Permanently removes this session and all attendance records marked against it. This
            cannot be undone.
          </p>
          <ConfirmButton
            action={`/api/v1/college/attendance/sessions/${row.id}`}
            method="DELETE"
            variant="danger"
            label="Delete session"
            confirmText="Delete this attendance session and its records permanently? This cannot be undone."
            redirectTo="/college/attendance"
          />
        </section>
      ) : null}
    </div>
  );
}
