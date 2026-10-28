import Link from "next/link";
import { PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { JsonForm, ConfirmButton, UploadField } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageNotices, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { notices } from "@/db/schema";
import { listUploadNames } from "@/lib/data";
import { desc, eq, sql } from "drizzle-orm";
import { normalizePagination } from "@/lib/pagination";
import { formatDateTime } from "@/lib/format";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CollegeNoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireCollegePage();
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { page: pageParam } = await searchParams;
  const { page, pageSize, offset } = normalizePagination({ page: pageParam });
  const where = eq(notices.collegeId, collegeId);
  const [rows, counted] = await Promise.all([
    db
      .select()
      .from(notices)
      .where(where)
      .orderBy(desc(notices.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(notices).where(where),
  ]);
  const total = counted?.[0]?.count ?? 0;
  const attachmentNames = await listUploadNames(
    rows.map((row) => row.attachmentId).filter((id): id is string => Boolean(id)),
  );

  return (
    <div>
      <PageHeader title="Notices" description="Publish announcements to students, staff, or everyone at this college." />
      {canManageNotices(user) ? (
        <section className="card mb-6 p-5">
          <JsonForm action="/api/v1/college/notices" submitLabel="Create notice">
            <div>
              <label className="label" htmlFor="title">Title</label>
              <input id="title" name="title" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="body">Body</label>
              <textarea id="body" name="body" className="textarea" rows={4} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="audience">Audience</label>
                <select id="audience" name="audience" className="select">
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="publishStatus">Status</label>
                <select id="publishStatus" name="publishStatus" className="select">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <UploadField
              name="attachmentId"
              label="Attachment (optional, max 5 MB)"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
            />
          </JsonForm>
        </section>
      ) : null}
      <div className="space-y-4">
        {rows.map((row) => (
          <article key={row.id} className="card p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{row.title}</h2>
              <StatusBadge status={row.publishStatus} />
              <StatusBadge status={row.audience} />
            </div>
            <p className="text-sm text-slate-500">{formatDateTime(row.publishedAt ?? row.createdAt)}</p>
            <p className="mt-3 whitespace-pre-wrap text-slate-700">{row.body}</p>
            {row.attachmentId ? (
              <p className="mt-3 text-sm">
                <a
                  href={`/api/v1/uploads/${row.attachmentId}`}
                  className="font-medium text-indigo-600"
                  target="_blank"
                  rel="noreferrer"
                >
                  Attachment: {attachmentNames[row.attachmentId] ?? "Download"}
                </a>
              </p>
            ) : null}
            {canManageNotices(user) ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link href={`/college/notices/${row.id}`} className="text-sm font-medium text-indigo-600">
                  Edit
                </Link>
                {row.publishStatus !== "published" ? (
                  <ConfirmButton
                    action={`/api/v1/college/notices/${row.id}`}
                    method="PATCH"
                    body={{ publishStatus: "published" }}
                    label="Publish"
                    confirmText="Publish this notice to the selected audience?"
                  />
                ) : (
                  <ConfirmButton
                    action={`/api/v1/college/notices/${row.id}`}
                    method="PATCH"
                    body={{ publishStatus: "archived" }}
                    label="Archive"
                    confirmText="Archive this notice?"
                  />
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      <Pagination basePath="/college/notices" params={{}} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
