import Link from "next/link";
import { desc, isNull, sql } from "drizzle-orm";
import { ConfirmButton, JsonForm } from "@/components/forms";
import { EmptyState, PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { db } from "@/db";
import { notices } from "@/db/schema";
import { requireAdminPage } from "@/lib/guard";
import { formatDateTime } from "@/lib/format";
import { normalizePagination } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function AdminNoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminPage();
  const { page: pageParam } = await searchParams;
  const { page, pageSize, offset } = normalizePagination({ page: pageParam });
  const where = isNull(notices.collegeId);
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

  return (
    <div>
      <PageHeader
        title="Platform notices"
        description="Publish platform-wide announcements to students, staff, or everyone across colleges."
      />
      <section className="card mb-6 max-w-3xl p-5">
        <JsonForm action="/api/v1/admin/notices" submitLabel="Create platform notice">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" name="title" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="body">Message</label>
            <textarea id="body" name="body" className="textarea" rows={4} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="audience">Audience</label>
              <select id="audience" name="audience" className="select" defaultValue="students">
                <option value="all">Everyone</option>
                <option value="students">Students</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="publishStatus">Status</label>
              <select id="publishStatus" name="publishStatus" className="select" defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Only published notices are visible in the selected audience portal. Platform notices have no file attachment.
          </p>
        </JsonForm>
      </section>
      {rows.length ? (
        <div className="space-y-4">
          {rows.map((row) => (
            <article key={row.id} className="card p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{row.title}</h2>
                <StatusBadge status={row.publishStatus} />
                <StatusBadge status={row.audience} />
              </div>
              <p className="text-sm text-slate-500">
                {formatDateTime(row.publishedAt ?? row.createdAt)}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-slate-700">{row.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/admin/notices/${row.id}`}
                  className="text-sm font-medium text-indigo-600"
                >
                  Edit
                </Link>
                {row.publishStatus === "published" ? (
                  <ConfirmButton
                    action={`/api/v1/admin/notices/${row.id}`}
                    method="PATCH"
                    body={{ publishStatus: "archived" }}
                    label="Archive"
                    confirmText="Archive this platform notice?"
                  />
                ) : (
                  <ConfirmButton
                    action={`/api/v1/admin/notices/${row.id}`}
                    method="PATCH"
                    body={{ publishStatus: "published" }}
                    label="Publish"
                    confirmText="Publish this notice to its selected audience across colleges?"
                  />
                )}
                <ConfirmButton
                  action={`/api/v1/admin/notices/${row.id}`}
                  method="DELETE"
                  variant="danger"
                  label="Delete"
                  confirmText="Delete this platform notice permanently?"
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No platform notices"
          description="Create a notice above to share an announcement across colleges."
        />
      )}
      <Pagination
        basePath="/admin/notices"
        params={{}}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </div>
  );
}
