import { notFound } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { buildTranscript, loadStudentForDocument } from "@/lib/documents";
import { pdfResponse } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiRequire(["college_admin", "faculty", "accounts_staff"]);
    const { id } = await context.params;
    const profile = await loadStudentForDocument(user, id);
    if (!profile) return notFound("Student not found.");
    const buffer = await buildTranscript(profile);
    return pdfResponse(`transcript-${profile.student.registrationNo}.pdf`, buffer);
  } catch (error) {
    return handleApiError(error);
  }
}
