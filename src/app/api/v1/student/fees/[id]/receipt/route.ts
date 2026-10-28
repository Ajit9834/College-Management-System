import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { feeInvoices } from "@/db/schema";
import { notFound } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { getStudentByUserId } from "@/lib/data";
import { buildReceipt } from "@/lib/documents";
import { pdfResponse } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiRequire(["student"]);
    const profile = await getStudentByUserId(user.id);
    if (!profile) return notFound("Student profile not found.");
    const { id } = await context.params;
    const [invoice] = await db
      .select({ id: feeInvoices.id })
      .from(feeInvoices)
      .where(and(eq(feeInvoices.id, id), eq(feeInvoices.studentId, profile.student.id)))
      .limit(1);
    if (!invoice) return notFound("Invoice not found.");
    const receipt = await buildReceipt(invoice.id, profile.student.collegeId);
    if (!receipt) return notFound("Invoice not found.");
    return pdfResponse(receipt.filename, receipt.buffer);
  } catch (error) {
    return handleApiError(error);
  }
}
