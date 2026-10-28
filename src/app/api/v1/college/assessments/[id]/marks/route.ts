import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, results, students } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, HttpError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { computeGrade } from "@/lib/permissions";
import { resultMarksSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = resultMarksSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [assessment] = await db
      .select()
      .from(assessments)
      .where(and(eq(assessments.id, id), eq(assessments.collegeId, collegeId)))
      .limit(1);
    if (!assessment) return notFound("Assessment not found.");

    for (const mark of parsed.data.marks) {
      if (mark.marks > assessment.maxMarks) {
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          `Marks cannot exceed ${assessment.maxMarks}.`,
        );
      }
    }

    await db.transaction(async (tx) => {
      for (const mark of parsed.data.marks) {
        const [student] = await tx
          .select()
          .from(students)
          .where(and(eq(students.id, mark.studentId), eq(students.collegeId, collegeId)))
          .limit(1);
        if (!student) continue;
        const grade = computeGrade(mark.marks, assessment.maxMarks);
        await tx
          .insert(results)
          .values({
            assessmentId: assessment.id,
            studentId: student.id,
            marks: mark.marks.toFixed(2),
            grade,
            publishedAt: assessment.publishStatus === "published" ? new Date() : null,
          })
          .onConflictDoUpdate({
            target: [results.assessmentId, results.studentId],
            set: {
              marks: mark.marks.toFixed(2),
              grade,
              updatedAt: new Date(),
            },
          });
      }
    });

    await writeAudit({
      actor,
      action: "results.marks.update",
      targetType: "assessment",
      targetId: assessment.id,
      collegeId,
    });
    return ok({ saved: parsed.data.marks.length });
  } catch (error) {
    return handleApiError(error);
  }
}
