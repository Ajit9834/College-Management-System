import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireAdminPage } from "@/lib/guard";
import { listAuditLogs } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string; action?: string; from?: string; to?: string }>;
}) {
  await requireAdminPage();
  const { actor, action, from, to } = await searchParams;
  const rows = await listAuditLogs({ actor, action, from, to, limit: 200 });
  const filtered = Boolean(actor || action || from || to);

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Immutable history of sensitive administrative and academic actions."
      />

      <form className="card mb-6 p-5" method="GET">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="label" htmlFor="actor">
              Actor
            </label>
            <input
              id="actor"
              name="actor"
              className="input"
              placeholder="Name or email"
              defaultValue={actor ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="action">
              Action
            </label>
            <input
              id="action"
              name="action"
              className="input"
              placeholder="e.g. department.update"
              defaultValue={action ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="from">
              From
            </label>
            <input id="from" name="from" type="date" className="input" defaultValue={from ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="to">
              To
            </label>
            <input id="to" name="to" type="date" className="input" defaultValue={to ?? ""} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn btn-primary" type="submit">
            Apply filters
          </button>
          <Link className="btn btn-ghost" href="/admin/audit">
            Reset
          </Link>
        </div>
      </form>

      <p className="mb-3 text-sm text-slate-500">
        {rows.length} {rows.length === 1 ? "entry" : "entries"}
        {filtered ? " match your filters." : " (latest 200)."}
      </p>

      <div className="table-wrap card">
        <table className="data">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatDateTime(row.createdAt)}</td>
                <td>
                  <p className="font-medium">{row.actorName ?? "System"}</p>
                  <p className="text-xs text-slate-500">{row.actorEmail}</p>
                </td>
                <td className="font-medium">{row.action}</td>
                <td>
                  {row.targetType}
                  {row.targetId ? ` · ${row.targetId.slice(0, 8)}` : ""}
                </td>
                <td>
                  <Link
                    href={`/admin/audit/${row.id}`}
                    className="text-sm font-medium text-indigo-600"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-slate-500">
                  No audit entries found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
