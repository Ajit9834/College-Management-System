import { PageHeader, StatusBadge } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { requireStudentPage } from "@/lib/guard";
import { getStudentByUserId } from "@/lib/data";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage() {
  const user = await requireStudentPage();
  const profile = await getStudentByUserId(user.id);
  if (!profile) redirect("/student");

  return (
    <div>
      <PageHeader title="My profile" description="You can update contact details. Academic fields are managed by your college." />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Contact details</h2>
          <JsonForm action="/api/v1/student/me" method="PATCH" submitLabel="Save contact details">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" className="input" defaultValue={profile.userPhone ?? ""} />
              </div>
              <div>
                <label className="label" htmlFor="emergencyContact">Emergency contact</label>
                <input id="emergencyContact" name="emergencyContact" className="input" defaultValue={profile.student.emergencyContact ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="address">Address</label>
                <textarea id="address" name="address" className="textarea" rows={3} defaultValue={profile.student.address ?? ""} />
              </div>
            </div>
          </JsonForm>
        </section>
        <aside className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Enrollment</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium">{profile.userName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Registration</dt>
              <dd className="font-medium">{profile.student.registrationNo}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Program</dt>
              <dd className="font-medium">{profile.programName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Department</dt>
              <dd className="font-medium">{profile.departmentName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Semester</dt>
              <dd className="font-medium">{profile.student.currentSemester}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd><StatusBadge status={profile.student.status} /></dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
