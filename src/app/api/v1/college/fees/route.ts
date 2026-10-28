import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { feeInvoices, students, users } from "@/db/schema";
import { created, notFound, ok, paginationMeta, parsePagination, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { syncOverdueInvoices } from "@/lib/data";
import { feeInvoiceSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequire(["college_admin", "accounts_staff"]);
    const collegeId = requireCollegeId(user);
    await syncOverdueInvoices(collegeId);
    const url = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(url.searchParams);
    const invoiceWhere = eq(feeInvoices.collegeId, collegeId);
    const [rows, counted] = await Promise.all([
      db
        .select({
          id: feeInvoices.id,
          title: feeInvoices.title,
          amount: feeInvoices.amount,
          dueDate: feeInvoices.dueDate,
          status: feeInvoices.status,
          studentId: feeInvoices.studentId,
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
    ]);
    const total = counted?.[0]?.count ?? 0;
    return ok(rows, paginationMeta(total, { page, pageSize }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await apiRequire(["college_admin", "accounts_staff"]);
    const collegeId = requireCollegeId(actor);
    const parsed = feeInvoiceSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, parsed.data.studentId))
      .limit(1);
    if (!student || student.collegeId !== collegeId) return notFound("Student not found.");
    const [row] = await db
      .insert(feeInvoices)
      .values({
        studentId: student.id,
        collegeId,
        title: parsed.data.title,
        amount: parsed.data.amount.toFixed(2),
        dueDate: parsed.data.dueDate,
        status: parsed.data.status ?? "pending",
      })
      .returning();
    await writeAudit({
      actor,
      action: "fee.invoice.create",
      targetType: "fee_invoice",
      targetId: row.id,
      collegeId,
    });
    return created(row);
  } catch (error) {
    return handleApiError(error);
  }
}
