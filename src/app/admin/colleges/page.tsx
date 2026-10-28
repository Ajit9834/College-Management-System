import Link from "next/link";
import { PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { requireAdminPage } from "@/lib/guard";
import { db } from "@/db";
import { colleges } from "@/db/schema";
import { asc, desc, sql } from "drizzle-orm";
import { normalizePagination } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function AdminCollegesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminPage();
  const { page: pageParam } = await searchParams;
  const { page, pageSize, offset } = normalizePagination({ page: pageParam });

  const [rows, counted] = await Promise.all([
    db
      .select()
      .from(colleges)
      .orderBy(desc(colleges.createdAt), asc(colleges.id))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(colleges),
  ]);
  const total = counted?.[0]?.count ?? 0;

  return (
    <div>
      <PageHeader title="Colleges" description="Create, review, and change college status. Privileged changes are audited." />
      <section className="card mb-6 p-5">
        <h2 className="mb-4 font-semibold">Add college</h2>
        <JsonForm action="/api/v1/admin/colleges" submitLabel="Create college">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="code">Code</label>
              <input id="code" name="code" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="city">City</label>
              <input id="city" name="city" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="state">State</label>
              <input id="state" name="state" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="establishedYear">Established year</label>
              <input id="establishedYear" name="establishedYear" type="number" className="input" />
            </div>
          </div>
        </JsonForm>
      </section>
      <div className="table-wrap card">
        <table className="data">
          <thead>
            <tr>
              <th>College</th>
              <th>Code</th>
              <th>Location</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.name}</td>
                <td>{row.code}</td>
                <td>{[row.city, row.state].filter(Boolean).join(", ") || "—"}</td>
                <td><StatusBadge status={row.status} /></td>
                <td>
                  <Link href={`/admin/colleges/${row.id}`} className="text-sm font-medium text-indigo-600">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/admin/colleges" params={{}} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
