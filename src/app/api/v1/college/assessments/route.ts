import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { assessments, courses, courseOfferings } from "@/db/schema";
import { created, ok, paginationMeta, parsePagination, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { isFacultyScoped } from "@/lib/permissions";
import { assessmentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(user);
    const url = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(url.searchParams);
    const where = and(
      eq(assessments.collegeId, collegeId),
      isFacultyScoped(user) ? eq(courseOfferings.facultyUserId, user.id) : undefined,
    );
    const [rows, counted] = await Promise.all([
      db
        .select({
          id: assessments.id,
          title: assessments.title,
          maxMarks: assessments.maxMarks,
          publishStatus: assessments.publishStatus,
          examDate: assessments.examDate,
          offeringId: assessments.offeringId,
          courseCode: courses.code,
          courseTitle: courses.title,
        })
        .from(assessments)
        .innerJoin(courseOfferings, eq(courseOfferings.id, assessments.offeringId))
        .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
        .where(where)
        .orderBy(desc(assessments.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(assessments)
        .innerJoin(courseOfferings, eq(courseOfferings.id, assessments.offeringId))
        .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
        .where(where),
    ]);
    const total = counted?.[0]?.count ?? 0;
    return ok(rows, paginationMeta(total, { page, pageSize }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(actor);
    const parsed = assessmentSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [row] = await db
      .insert(assessments)
      .values({
        offeringId: parsed.data.offeringId,
        collegeId,
        title: parsed.data.title,
        maxMarks: parsed.data.maxMarks,
        examDate: parsed.data.examDate || null,
        publishStatus: "draft",
      })
      .returning();
    return created(row);
  } catch (error) {
    return handleApiError(error);
  }
}
