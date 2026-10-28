import Link from "next/link";
import { PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { JsonForm } from "@/components/forms";
import { requireCollegePage } from "@/lib/guard";
import { listCollegeStudents } from "@/lib/data";
import { normalizePagination } from "@/lib/pagination";
import { canManageFees, primaryCollegeId } from "@/lib/permissions";
import { db } from "@/db";
import { feeInvoices, students, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { formatDate, formatMoney } from "@/lib/format";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireCollegePage(["college_admin", "accounts_staff"]);
  const collegeId = primaryCollegeId(user);
  if (!collegeId) redirect("/access-denied");
  const { page: pageParam } = await searchParams;
  const { page, pageSize, offset } = normalizePagination({ page: pageParam });
  const invoiceWhere = eq(feeInvoices.collegeId, collegeId);
  const [invoiceResult, studentRows] = await Promise.all([
    Promise.all([
      db
        .select({
          id: feeInvoices.id,
          title: feeInvoices.title,
          amount: feeInvoices.amount,
          dueDate: feeInvoices.dueDate,
          status: feeInvoices.status,
          studentName: users.fullName,
          registrationNo: students.registrationNo,
        })
        .from(feeInvoices)
        .innerJoin(students, eq(students.id, feeInvoices.studentId))
        .innerJoin(users, eq(users.id, students.userId))
        .where(invoiceWhere)
        .orderBy(desc(feeInvoices.dueDate))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(feeInvoices)
        .innerJoin(students, eq(students.id, feeInvoices.studentId))
        .innerJoin(users, eq(users.id, students.userId))
        .where(invoiceWhere),
    ]),
    listCollegeStudents(collegeId),
  ]);
  const [invoices, counted] = invoiceResult;
  const total = counted?.[0]?.count ?? 0;

  return (
    <div>
      <PageHeader title="Fees" description="Track invoices and recorded payments. No payment gateway in MVP." />
      {canManageFees(user) ? (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Create invoice</h2>
            <JsonForm action="/api/v1/college/fees" submitLabel="Create invoice">
              <div>
                <label className="label" htmlFor="studentId">Student</label>
                <select id="studentId" name="studentId" className="select">
                  {studentRows.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} · {s.registrationNo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="title">Title</label>
                <input id="title" name="title" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="amount">Amount (INR)</label>
                <input id="amount" name="amount" type="number" min={0} className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="dueDate">Due date</label>
                <input id="dueDate" name="dueDate" type="date" className="input" required />
              </div>
            </JsonForm>
          </section>
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Record payments</h2>
            <p className="text-sm text-slate-500">
              Open an invoice below to record a payment, edit the amount, or cancel it.
            </p>
          </section>
        </div>
      ) : null}
      <div className="table-wrap card">
        <table className="data">
          <thead>
            <tr>
              <th>Student</th>
              <th>Title</th>
              <th>Amount</th>
              <th>Due</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((row) => (
              <tr key={row.id}>
                <td>
                  <p className="font-medium">{row.studentName}</p>
                  <p className="text-xs text-slate-500">{row.registrationNo}</p>
                </td>
                <td>{row.title}</td>
                <td>{formatMoney(row.amount)}</td>
                <td>{formatDate(row.dueDate)}</td>
                <td><StatusBadge status={row.status} /></td>
                <td>
                  <Link href={`/college/fees/${row.id}`} className="text-sm font-medium text-indigo-600">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/college/fees" params={{}} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
