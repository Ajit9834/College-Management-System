import { EmptyState, PageHeader, StatusBadge, StatCard } from "@/components/ui";
import { requireStudentPage } from "@/lib/guard";
import { getStudentByUserId, listStudentFees } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { SampleDataNotice } from "@/components/sample-data-notice";
import { demoInvoices } from "../demo-data";

export const dynamic = "force-dynamic";

export default async function StudentFeesPage() {
  const user = await requireStudentPage();
  const profile = await getStudentByUserId(user.id);
  const savedData = profile ? await listStudentFees(profile.student.id) : { invoices: [], transactions: [] };
  const usingSampleData = savedData.invoices.length === 0;
  const invoices = usingSampleData ? demoInvoices : savedData.invoices;
  const outstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div>
      <PageHeader title="Fees" description="Invoice tracking only — EduSphere does not collect payments in this MVP." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Invoices" value={invoices.length} />
        <StatCard label="Outstanding" value={formatMoney(outstanding)} accent="amber" />
        <StatCard label="Payments recorded" value={savedData.transactions.length} accent="emerald" />
      </div>
      {usingSampleData ? <SampleDataNotice /> : null}
      {invoices.length > 0 ? (
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
              {invoices.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.title}</td>
                  <td>{formatMoney(row.amount)}</td>
                  <td>{formatDate(row.dueDate)}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>
                    {usingSampleData ? (
                      <span className="text-sm text-slate-400">Sample only</span>
                    ) : (
                    <a
                      className="text-sm font-medium text-indigo-600"
                      href={`/api/v1/student/fees/${row.id}/receipt`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Receipt (PDF)
                    </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No invoices" description="Fee invoices from accounts staff will show here." />}
    </div>
  );
}
