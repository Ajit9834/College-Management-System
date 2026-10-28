import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { courseOfferings, courses, timetableEntries } from "@/db/schema";
import { created, notFound, ok, paginationMeta, parsePagination, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { findTimetableConflict } from "@/lib/data";
import { timetableSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(user);
    const url = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(url.searchParams);
    const where = eq(timetableEntries.collegeId, collegeId);
    const [rows, counted] = await Promise.all([
      db
        .select({
          id: timetableEntries.id,
          weekday: timetableEntries.weekday,
          startsAt: timetableEntries.startsAt,
          endsAt: timetableEntries.endsAt,
          room: timetableEntries.room,
          offeringId: timetableEntries.offeringId,
          courseCode: courses.code,
          courseTitle: courses.title,
        })
        .from(timetableEntries)
        .innerJoin(courseOfferings, eq(courseOfferings.id, timetableEntries.offeringId))
        .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
        .where(where)
        .orderBy(asc(timetableEntries.weekday), asc(timetableEntries.startsAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(timetableEntries)
        .innerJoin(courseOfferings, eq(courseOfferings.id, timetableEntries.offeringId))
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
    const parsed = timetableSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [offering] = await db
      .select()
      .from(courseOfferings)
      .where(and(eq(courseOfferings.id, parsed.data.offeringId), eq(courseOfferings.collegeId, collegeId)))
      .limit(1);
    if (!offering) return notFound("Course offering not found.");
    const conflict = await findTimetableConflict({
      collegeId,
      weekday: parsed.data.weekday,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      room: parsed.data.room ?? null,
      offeringId: offering.id,
    });
    if (conflict) return validationError(conflict);
    const [row] = await db
      .insert(timetableEntries)
      .values({ ...parsed.data, collegeId })
      .returning();
    return created(row);
  } catch (error) {
    return handleApiError(error);
  }
}
