import { PageHeader } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { requireAdminPage } from "@/lib/guard";
import { getSettingsMap } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const settings = await getSettingsMap();

  return (
    <div>
      <PageHeader title="Platform settings" description="Global reference values. Dates are stored in UTC and displayed in the configured timezone." />
      <section className="card max-w-xl p-6">
        <JsonForm action="/api/v1/admin/settings" method="PATCH" submitLabel="Save settings">
          <div>
            <label className="label" htmlFor="platform_name">Platform name</label>
            <input id="platform_name" name="platform_name" className="input" defaultValue={settings.platform_name ?? "CampusFlow"} />
          </div>
          <div>
            <label className="label" htmlFor="timezone">Timezone</label>
            <input id="timezone" name="timezone" className="input" defaultValue={settings.timezone ?? "Asia/Kolkata"} />
          </div>
          <div>
            <label className="label" htmlFor="academic_year">Academic year</label>
            <input id="academic_year" name="academic_year" className="input" defaultValue={settings.academic_year ?? "2025-2026"} />
          </div>
          <div>
            <label className="label" htmlFor="support_email">Support email</label>
            <input id="support_email" name="support_email" type="email" className="input" defaultValue={settings.support_email ?? ""} />
          </div>
        </JsonForm>
      </section>
    </div>
  );
}
