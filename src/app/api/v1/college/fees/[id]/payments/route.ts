import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { feeInvoices, feeTransactions } from "@/db/schema";
import { created, notFound, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { feePaymentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "accounts_staff"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = feePaymentSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [invoice] = await db
      .select()
      .from(feeInvoices)
      .where(and(eq(feeInvoices.id, id), eq(feeInvoices.collegeId, collegeId)))
      .limit(1);
    if (!invoice) return notFound("Invoice not found.");

    const [tx] = await db
      .insert(feeTransactions)
      .values({
        invoiceId: invoice.id,
        amount: parsed.data.amount.toFixed(2),
        reference: parsed.data.reference ?? null,
        notes: parsed.data.notes ?? null,
        status: "paid",
        recordedBy: actor.id,
      })
      .returning();

    const existing = await db
      .select()
      .from(feeTransactions)
      .where(eq(feeTransactions.invoiceId, invoice.id));
    const paid = existing.reduce((sum, row) => sum + Number(row.amount), 0);
    const total = Number(invoice.amount);
    const nextStatus = paid >= total ? "paid" : paid > 0 ? "partially_paid" : invoice.status;

    await db
      .update(feeInvoices)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(feeInvoices.id, invoice.id));

    await writeAudit({
      actor,
      action: "fee.payment.record",
      targetType: "fee_invoice",
      targetId: invoice.id,
      collegeId,
      metadata: { amount: parsed.data.amount, reference: parsed.data.reference },
    });
    return created(tx);
  } catch (error) {
    return handleApiError(error);
  }
}
