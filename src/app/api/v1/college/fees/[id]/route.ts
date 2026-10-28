import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { feeInvoices } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { feeInvoiceUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "accounts_staff"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = feeInvoiceUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [existing] = await db
      .select()
      .from(feeInvoices)
      .where(and(eq(feeInvoices.id, id), eq(feeInvoices.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Invoice not found.");

    const [row] = await db
      .update(feeInvoices)
      .set({
        title: parsed.data.title ?? existing.title,
        amount:
          parsed.data.amount === undefined
            ? existing.amount
            : parsed.data.amount.toFixed(2),
        dueDate: parsed.data.dueDate ?? existing.dueDate,
        status: parsed.data.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(feeInvoices.id, id))
      .returning();

    await writeAudit({
      actor,
      action: "fee.invoice.update",
      targetType: "fee_invoice",
      targetId: id,
      collegeId,
      metadata: parsed.data,
    });
    return ok(row);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "accounts_staff"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const [existing] = await db
      .select()
      .from(feeInvoices)
      .where(and(eq(feeInvoices.id, id), eq(feeInvoices.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Invoice not found.");
    await db.delete(feeInvoices).where(eq(feeInvoices.id, id));
    await writeAudit({
      actor,
      action: "fee.invoice.delete",
      targetType: "fee_invoice",
      targetId: id,
      collegeId,
      metadata: { title: existing.title },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
