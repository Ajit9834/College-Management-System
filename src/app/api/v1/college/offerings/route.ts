import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courseOfferings, courses } from "@/db/schema";
import { created, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { offeringSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(user);
    const rows = await db
      .select({
        id: courseOfferings.id,
        academicYear: courseOfferings.academicYear,
        semester: courseOfferings.semester,
        status: courseOfferings.status,
        facultyUserId: courseOfferings.facultyUserId,
        courseId: courses.id,
        courseCode: courses.code,
        courseTitle: courses.title,
      })
      .from(courseOfferings)
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .where(eq(courseOfferings.collegeId, collegeId));
    return ok(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const parsed = offeringSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [row] = await db
      .insert(courseOfferings)
      .values({ ...parsed.data, collegeId, status: "active" })
      .returning();
    return created(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("offerings_unique")) {
      return validationError("This course is already offered for that year and semester.");
    }
    return handleApiError(error);
  }
}
