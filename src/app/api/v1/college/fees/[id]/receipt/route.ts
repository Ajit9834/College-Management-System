import { notFound } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { buildReceipt } from "@/lib/documents";
import { pdfResponse } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "accounts_staff"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const receipt = await buildReceipt(id, collegeId);
    if (!receipt) return notFound("Invoice not found.");
    return pdfResponse(receipt.filename, receipt.buffer);
  } catch (error) {
    return handleApiError(error);
  }
}
