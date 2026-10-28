import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendanceSessions, courseOfferings } from "@/db/schema";
import { created, notFound, ok, paginationMeta, parsePagination, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { isFacultyScoped } from "@/lib/permissions";
import { attendanceSessionSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequire(["college_admin", "faculty"]);
    const collegeId = requireCollegeId(user);
    const url = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(url.searchParams);
    const where = and(
      eq(attendanceSessions.collegeId, collegeId),
      isFacultyScoped(user)
        ? inArray(
            attendanceSessions.offeringId,
            db
              .select({ id: courseOfferings.id })
              .from(courseOfferings)
              .where(eq(courseOfferings.facultyUserId, user.id)),
          )
        : undefined,
    );
    const [rows, counted] = await Promise.all([
      db
        .select()
        .from(attendanceSessions)
        .where(where)
        .orderBy(desc(attendanceSessions.sessionDate))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(attendanceSessions).where(where),
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
    const parsed = attendanceSessionSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [offering] = await db
      .select()
      .from(courseOfferings)
      .where(and(eq(courseOfferings.id, parsed.data.offeringId), eq(courseOfferings.collegeId, collegeId)))
      .limit(1);
    if (!offering) return notFound("Course offering not found.");
    const [row] = await db
      .insert(attendanceSessions)
      .values({
        offeringId: offering.id,
        collegeId,
        sessionDate: parsed.data.sessionDate,
        topic: parsed.data.topic ?? null,
        createdBy: actor.id,
      })
      .returning();
    await writeAudit({
      actor,
      action: "attendance.session.create",
      targetType: "attendance_session",
      targetId: row.id,
      collegeId,
    });
    return created(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("attendance_session_unique")) {
      return validationError("An attendance session already exists for this date.");
    }
    return handleApiError(error);
  }
}
