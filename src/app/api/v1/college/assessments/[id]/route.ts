import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, courseOfferings, results } from "@/db/schema";
import { forbidden, notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { canAccessOffering, canPublishResults } from "@/lib/permissions";
import { assessmentUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = assessmentUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [assessmentRow] = await db
      .select({
        assessment: assessments,
        facultyUserId: courseOfferings.facultyUserId,
      })
      .from(assessments)
      .innerJoin(courseOfferings, eq(courseOfferings.id, assessments.offeringId))
      .where(
        and(
          eq(assessments.id, id),
          eq(assessments.collegeId, collegeId),
          eq(courseOfferings.collegeId, collegeId),
        ),
      )
      .limit(1);
    if (!assessmentRow || !canAccessOffering(actor, assessmentRow.facultyUserId)) {
      return notFound("Assessment not found.");
    }
    if (parsed.data.publishStatus !== undefined && !canPublishResults(actor)) {
      return forbidden("Only college administrators can change result visibility.");
    }
    const existing = assessmentRow.assessment;

    const nextStatus = parsed.data.publishStatus ?? existing.publishStatus;
    const now = new Date();
    const publishedAt =
      nextStatus === "published"
        ? existing.publishedAt ?? now
        : nextStatus === "draft"
          ? null
          : existing.publishedAt;

    const row = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(assessments)
        .set({
          title: parsed.data.title ?? existing.title,
          maxMarks: parsed.data.maxMarks ?? existing.maxMarks,
          examDate:
            parsed.data.examDate === undefined
              ? existing.examDate
              : parsed.data.examDate || null,
          publishStatus: nextStatus,
          publishedAt,
          updatedAt: now,
        })
        .where(eq(assessments.id, id))
        .returning();

      if (nextStatus === "published") {
        await tx
          .update(results)
          .set({ publishedAt: publishedAt ?? now, updatedAt: now })
          .where(eq(results.assessmentId, id));
      } else if (nextStatus === "draft") {
        await tx
          .update(results)
          .set({ publishedAt: null, updatedAt: now })
          .where(eq(results.assessmentId, id));
      }
      return updated;
    });

    await writeAudit({
      actor,
      action: "assessment.update",
      targetType: "assessment",
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
    const actor = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const [assessmentRow] = await db
      .select({
        assessment: assessments,
        facultyUserId: courseOfferings.facultyUserId,
      })
      .from(assessments)
      .innerJoin(courseOfferings, eq(courseOfferings.id, assessments.offeringId))
      .where(
        and(
          eq(assessments.id, id),
          eq(assessments.collegeId, collegeId),
          eq(courseOfferings.collegeId, collegeId),
        ),
      )
      .limit(1);
    if (!assessmentRow || !canAccessOffering(actor, assessmentRow.facultyUserId)) {
      return notFound("Assessment not found.");
    }
    const existing = assessmentRow.assessment;
    await db.delete(assessments).where(eq(assessments.id, id));
    await writeAudit({
      actor,
      action: "assessment.delete",
      targetType: "assessment",
      targetId: id,
      collegeId,
      metadata: { title: existing.title },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
