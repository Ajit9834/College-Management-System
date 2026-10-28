import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, results } from "@/db/schema";
import { forbidden, notFound, ok } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { canPublishResults } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin"]);
    if (!canPublishResults(actor)) {
      return forbidden("Only college administrators can publish results.");
    }
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(and(eq(assessments.id, id), eq(assessments.collegeId, collegeId)))
      .limit(1);
    if (!assessment) return notFound("Assessment not found.");

    const publishedAt = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(assessments)
        .set({ publishStatus: "published", publishedAt, updatedAt: publishedAt })
        .where(eq(assessments.id, id));
      await tx
        .update(results)
        .set({ publishedAt, updatedAt: publishedAt })
        .where(eq(results.assessmentId, id));
    });

    await writeAudit({
      actor,
      action: "results.publish",
      targetType: "assessment",
      targetId: id,
      collegeId,
      metadata: { title: assessment.title },
    });
    return ok({ published: true });
  } catch (error) {
    return handleApiError(error);
  }
}
