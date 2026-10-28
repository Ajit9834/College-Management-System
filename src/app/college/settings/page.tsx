import { PageHeader, StatusBadge } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageCollegeSettings, primaryCollegeId, roleLabel } from "@/lib/permissions";
import { db } from "@/db";
import { colleges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}

export default async function CollegeSettingsPage() {
  const user = await requireCollegePage();
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const [college] = await db.select().from(colleges).where(eq(colleges.id, collegeId)).limit(1);
  const canEdit = canManageCollegeSettings(user);

  return (
    <div>
      <PageHeader
        title="College settings"
        description={
          canEdit
            ? "Keep your college profile up to date. Name, code, and status are managed by platform admins."
            : "Read-only college profile for staff. Only college admins can edit these details."
        }
      />

      <section className="card mb-6 max-w-xl p-6">
        <h2 className="mb-4 font-semibold">Account</h2>
        <dl className="space-y-3 text-sm">
          <Field label="College" value={college?.name} />
          <Field label="Code" value={college?.code} />
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1">
              <StatusBadge status={college?.status ?? "inactive"} />
            </dd>
          </div>
          <Field label="Your role" value={user.roles.map((r) => roleLabel(r.role)).join(", ")} />
          <Field label="Signed in as" value={user.email} />
        </dl>
      </section>

      {canEdit ? (
        <section className="card max-w-xl p-6">
          <h2 className="mb-4 font-semibold">Profile details</h2>
          <JsonForm
            action="/api/v1/college/settings"
            method="PATCH"
            submitLabel="Save changes"
            successMessage="College profile updated."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="city">
                  City
                </label>
                <input id="city" name="city" className="input" defaultValue={college?.city ?? ""} />
              </div>
              <div>
                <label className="label" htmlFor="state">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  className="input"
                  defaultValue={college?.state ?? ""}
                />
              </div>
              <div>
                <label className="label" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  className="input"
                  defaultValue={college?.phone ?? ""}
                />
              </div>
              <div>
                <label className="label" htmlFor="email">
                  Contact email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  defaultValue={college?.email ?? ""}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="website">
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  className="input"
                  defaultValue={college?.website ?? ""}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="address">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  className="input"
                  defaultValue={college?.address ?? ""}
                />
              </div>
            </div>
          </JsonForm>
        </section>
      ) : (
        <section className="card max-w-xl p-6">
          <h2 className="mb-4 font-semibold">Profile details</h2>
          <dl className="space-y-3 text-sm">
            <Field label="City" value={college?.city} />
            <Field label="State" value={college?.state} />
            <Field label="Phone" value={college?.phone} />
            <Field label="Contact email" value={college?.email} />
            <Field label="Website" value={college?.website} />
            <Field label="Address" value={college?.address} />
          </dl>
        </section>
      )}
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
