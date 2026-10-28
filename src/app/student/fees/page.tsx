import { EmptyState, PageHeader, StatusBadge, StatCard } from "@/components/ui";
import { requireStudentPage } from "@/lib/guard";
import { getStudentByUserId, listStudentFees } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentFeesPage() {
  const user = await requireStudentPage();
  const profile = await getStudentByUserId(user.id);
  const data = profile ? await listStudentFees(profile.student.id) : { invoices: [], transactions: [] };
  const outstanding = data.invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div>
      <PageHeader title="Fees" description="Invoice tracking only — CampusFlow does not collect payments in this MVP." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Invoices" value={data.invoices.length} />
        <StatCard label="Outstanding" value={formatMoney(outstanding)} accent="amber" />
        <StatCard label="Payments recorded" value={data.transactions.length} accent="emerald" />
      </div>
      {data.invoices.length === 0 ? (
        <EmptyState title="No invoices" description="Fee invoices from accounts staff will show here." />
      ) : (
        <div className="table-wrap card">
          <table className="data">
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Due</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.title}</td>
                  <td>{formatMoney(row.amount)}</td>
                  <td>{formatDate(row.dueDate)}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>
                    <a
                      className="text-sm font-medium text-indigo-600"
                      href={`/api/v1/student/fees/${row.id}/receipt`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Receipt (PDF)
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
