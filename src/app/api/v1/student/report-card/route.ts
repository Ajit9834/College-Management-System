import { notFound } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { getStudentByUserId } from "@/lib/data";
import { buildReportCard } from "@/lib/documents";
import { pdfResponse } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequire(["student"]);
    const profile = await getStudentByUserId(user.id);
    if (!profile) return notFound("Student profile not found.");
    const buffer = await buildReportCard(profile);
    return pdfResponse(`report-card-${profile.student.registrationNo}.pdf`, buffer);
  } catch (error) {
    return handleApiError(error);
  }
}
