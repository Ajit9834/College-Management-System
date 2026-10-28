import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmButton, JsonForm, UploadField } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageNotices, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { notices } from "@/db/schema";
import { listUploadNames } from "@/lib/data";
import { and, eq } from "drizzle-orm";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NoticeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCollegePage();
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { id } = await params;
  const [row] = await db
    .select()
    .from(notices)
    .where(and(eq(notices.id, id), eq(notices.collegeId, collegeId)))
    .limit(1);
  if (!row) notFound();
  const attachmentNames = row.attachmentId
    ? await listUploadNames([row.attachmentId])
    : {};

  return (
    <div>
      <PageHeader title={row.title} description={`Created ${formatDateTime(row.createdAt)}`} />
      <Link href="/college/notices" className="mb-4 inline-block text-sm text-indigo-600">
        ← Back to notices
      </Link>
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusBadge status={row.publishStatus} />
        <StatusBadge status={row.audience} />
      </div>
      {canManageNotices(user) ? (
        <section className="card max-w-2xl p-5">
          <h2 className="mb-4 font-semibold">Edit notice</h2>
          <JsonForm
            action={`/api/v1/college/notices/${row.id}`}
            method="PATCH"
            submitLabel="Save changes"
            successMessage="Notice updated."
          >
            <div>
              <label className="label" htmlFor="title">Title</label>
              <input id="title" name="title" className="input" defaultValue={row.title} required />
            </div>
            <div>
              <label className="label" htmlFor="body">Body</label>
              <textarea id="body" name="body" className="textarea" rows={6} defaultValue={row.body} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="audience">Audience</label>
                <select id="audience" name="audience" className="select" defaultValue={row.audience}>
                  <option value="all">All</option>
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
            <UploadField
              name="attachmentId"
              label="Attachment (optional, max 5 MB)"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
              defaultValue={row.attachmentId ?? undefined}
              defaultFileName={row.attachmentId ? attachmentNames[row.attachmentId] ?? "file" : null}
            />
          </JsonForm>
        </section>
      ) : (
        <p className="text-sm text-slate-500">You do not have permission to edit notices.</p>
      )}
      {canManageNotices(user) ? (
        <section className="card mt-6 max-w-2xl border-rose-200 p-5">
          <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
          <p className="mb-4 text-sm text-slate-500">
            Permanently removes this notice. This cannot be undone.
          </p>
          <ConfirmButton
            action={`/api/v1/college/notices/${row.id}`}
            method="DELETE"
            variant="danger"
            label="Delete notice"
            confirmText="Delete this notice permanently? This cannot be undone."
            redirectTo="/college/notices"
          />
        </section>
      ) : null}
    </div>
  );
}
