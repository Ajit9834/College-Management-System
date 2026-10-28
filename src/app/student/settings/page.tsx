import { PageHeader } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { requireStudentPage } from "@/lib/guard";
import { roleLabel } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function StudentSettingsPage() {
  const user = await requireStudentPage();
  return (
    <div>
      <PageHeader title="Account settings" description="Session and role details for your student account." />
      <section className="card max-w-xl p-6">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Signed in as</dt>
            <dd className="font-medium">{user.fullName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Roles</dt>
            <dd className="font-medium">{user.roles.map((r) => roleLabel(r.role)).join(", ")}</dd>
          </div>
        </dl>
      </section>
      <section className="card mt-6 max-w-xl p-6">
        <h2 className="mb-1 font-semibold">Change password</h2>
        <p className="mb-4 text-sm text-slate-500">
          Updating your password signs you out on other devices.
        </p>
        <JsonForm
          action="/api/v1/auth/change-password"
          method="POST"
          submitLabel="Update password"
          successMessage="Password updated."
        >
          <div>
            <label className="label" htmlFor="currentPassword">
              Current password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="newPassword">
                New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                className="input"
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="confirmPassword">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="input"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
        </JsonForm>
      </section>
    </div>
  );
}
