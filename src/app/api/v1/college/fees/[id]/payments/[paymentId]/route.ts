import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { feeInvoices, feeTransactions } from "@/db/schema";
import { notFound, ok } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; paymentId: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "accounts_staff"]);
    const collegeId = requireCollegeId(actor);
    const { id, paymentId } = await context.params;

    const [invoice] = await db
      .select()
      .from(feeInvoices)
      .where(and(eq(feeInvoices.id, id), eq(feeInvoices.collegeId, collegeId)))
      .limit(1);
    if (!invoice) return notFound("Invoice not found.");

    const [payment] = await db
      .select()
      .from(feeTransactions)
      .where(and(eq(feeTransactions.id, paymentId), eq(feeTransactions.invoiceId, invoice.id)))
      .limit(1);
    if (!payment) return notFound("Payment not found.");

    await db.delete(feeTransactions).where(eq(feeTransactions.id, payment.id));

    // Recalculate the invoice status from the payments that remain.
    const remaining = await db
      .select()
      .from(feeTransactions)
      .where(eq(feeTransactions.invoiceId, invoice.id));
    const paid = remaining.reduce((sum, row) => sum + Number(row.amount), 0);
    const total = Number(invoice.amount);
    const today = new Date().toISOString().slice(0, 10);
    const nextStatus =
      paid >= total
        ? "paid"
        : paid > 0
          ? "partially_paid"
          : invoice.dueDate < today
            ? "overdue"
            : "pending";

    await db
      .update(feeInvoices)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(feeInvoices.id, invoice.id));

    await writeAudit({
      actor,
      action: "fee.payment.delete",
      targetType: "fee_invoice",
      targetId: invoice.id,
      collegeId,
      metadata: { paymentId: payment.id, amount: payment.amount },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
