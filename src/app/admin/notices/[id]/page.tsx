import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { JsonForm } from "@/components/forms";
import { PageHeader, StatusBadge } from "@/components/ui";
import { db } from "@/db";
import { notices } from "@/db/schema";
import { requireAdminPage } from "@/lib/guard";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminNoticeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const [row] = await db
    .select()
    .from(notices)
    .where(and(eq(notices.id, id), isNull(notices.collegeId)))
    .limit(1);
  if (!row) notFound();

  return (
    <div>
      <PageHeader title={row.title} description={`Created ${formatDateTime(row.createdAt)}`} />
      <Link href="/admin/notices" className="mb-4 inline-block text-sm text-indigo-600">
        Back to platform notices
      </Link>
      <div className="mb-6 flex gap-2">
        <StatusBadge status={row.publishStatus} />
        <StatusBadge status={row.audience} />
      </div>
      <section className="card max-w-2xl p-5">
        <JsonForm
          action={`/api/v1/admin/notices/${row.id}`}
          method="PATCH"
          submitLabel="Save changes"
          successMessage="Platform notice updated."
        >
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" name="title" className="input" defaultValue={row.title} required />
          </div>
          <div>
            <label className="label" htmlFor="body">Message</label>
            <textarea id="body" name="body" className="textarea" rows={6} defaultValue={row.body} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="audience">Audience</label>
              <select id="audience" name="audience" className="select" defaultValue={row.audience}>
                <option value="all">Everyone</option>
                <option value="students">Students</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="publishStatus">Status</label>
              <select id="publishStatus" name="publishStatus" className="select" defaultValue={row.publishStatus}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </JsonForm>
      </section>
    </div>
  );
}
