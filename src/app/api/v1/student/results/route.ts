import { notFound, ok } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { getStudentByUserId, listStudentResults } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequire(["student"]);
    const profile = await getStudentByUserId(user.id);
    if (!profile) return notFound("Student profile not found.");
    return ok(await listStudentResults(profile.student.id));
  } catch (error) {
    return handleApiError(error);
  }
}
