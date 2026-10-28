import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmButton, JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { canManageFees, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { feeInvoices, feeTransactions, students, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FeeInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCollegePage(["college_admin", "accounts_staff"]);
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { id } = await params;
  const [row] = await db
    .select()
    .from(feeInvoices)
    .where(and(eq(feeInvoices.id, id), eq(feeInvoices.collegeId, collegeId)))
    .limit(1);
  if (!row) notFound();

  const [student] = await db
    .select({ fullName: users.fullName, registrationNo: students.registrationNo })
    .from(students)
    .innerJoin(users, eq(users.id, students.userId))
    .where(eq(students.id, row.studentId))
    .limit(1);
  const payments = await db
    .select()
    .from(feeTransactions)
    .where(eq(feeTransactions.invoiceId, id))
    .orderBy(desc(feeTransactions.recordedAt));

  return (
    <div>
      <PageHeader
        title={row.title}
        description={student ? `${student.fullName} · ${student.registrationNo}` : "Invoice"}
      />
      <Link href="/college/fees" className="mb-4 inline-block text-sm text-indigo-600">
        ← Back to fees
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={row.status} />
        <span className="badge bg-slate-100 text-slate-700">{formatMoney(row.amount)}</span>
        <span className="badge bg-slate-100 text-slate-700">Due {formatDate(row.dueDate)}</span>
        <a
          className="btn btn-secondary ml-auto"
          href={`/api/v1/college/fees/${row.id}/receipt`}
          target="_blank"
          rel="noreferrer"
        >
          Receipt (PDF)
        </a>
      </div>
      {canManageFees(user) ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Edit invoice</h2>
            <JsonForm
              action={`/api/v1/college/fees/${row.id}`}
              method="PATCH"
              submitLabel="Save changes"
              successMessage="Invoice updated."
            >
              <div>
                <label className="label" htmlFor="title">Title</label>
                <input id="title" name="title" className="input" defaultValue={row.title} required />
              </div>
              <div>
                <label className="label" htmlFor="amount">Amount (INR)</label>
                <input id="amount" name="amount" type="number" min={0} className="input" defaultValue={Number(row.amount)} required />
              </div>
              <div>
                <label className="label" htmlFor="dueDate">Due date</label>
                <input id="dueDate" name="dueDate" type="date" className="input" defaultValue={row.dueDate} required />
              </div>
              <div>
                <label className="label" htmlFor="status">Status</label>
                <select id="status" name="status" className="select" defaultValue={row.status}>
                  <option value="pending">Pending</option>
                  <option value="partially_paid">Partially paid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </JsonForm>
          </section>
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Record payment</h2>
            <JsonForm
              action={`/api/v1/college/fees/${row.id}/payments`}
              submitLabel="Record payment"
              successMessage="Payment recorded."
            >
              <div>
                <label className="label" htmlFor="amount">Amount (INR)</label>
                <input id="amount" name="amount" type="number" min={0} className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="reference">Reference</label>
                <input id="reference" name="reference" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" className="textarea" rows={2} />
              </div>
            </JsonForm>
            <h3 className="mt-6 mb-3 text-sm font-semibold text-slate-600">Payment history</h3>
            <ul className="space-y-2 text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span>
                    {formatDate(p.recordedAt)}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </span>
                  <span className="flex items-center gap-3">
                    <span>{formatMoney(p.amount)}</span>
                    <ConfirmButton
                      action={`/api/v1/college/fees/${row.id}/payments/${p.id}`}
                      method="DELETE"
                      variant="danger"
                      label="Delete"
                      confirmText="Delete this payment? The invoice balance will be recalculated."
                    />
                  </span>
                </li>
              ))}
              {payments.length === 0 ? <li className="text-slate-500">No payments recorded.</li> : null}
            </ul>
          </section>
        </div>
      ) : (
        <p className="text-sm text-slate-500">You do not have permission to manage fees.</p>
      )}
      {canManageFees(user) ? (
        <section className="card mt-6 max-w-2xl border-rose-200 p-5">
          <h2 className="mb-2 font-semibold text-rose-700">Danger zone</h2>
          <p className="mb-4 text-sm text-slate-500">
            Permanently removes this invoice and its recorded payments. This cannot be undone.
          </p>
          <ConfirmButton
            action={`/api/v1/college/fees/${row.id}`}
            method="DELETE"
            variant="danger"
            label="Delete invoice"
            confirmText="Delete this invoice permanently? This cannot be undone."
            redirectTo="/college/fees"
          />
        </section>
      ) : null}
    </div>
  );
}
