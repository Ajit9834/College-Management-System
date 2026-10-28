import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { created, ok, paginationMeta, parsePagination, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { departmentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequire(["college_admin", "faculty", "accounts_staff"]);
    const collegeId = requireCollegeId(user);
    const url = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(url.searchParams);
    const where = eq(departments.collegeId, collegeId);
    const [rows, counted] = await Promise.all([
      db
        .select()
        .from(departments)
        .where(where)
        .orderBy(asc(departments.name))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(departments).where(where),
    ]);
    const total = counted?.[0]?.count ?? 0;
    return ok(rows, paginationMeta(total, { page, pageSize }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const parsed = departmentSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [row] = await db
      .insert(departments)
      .values({ ...parsed.data, collegeId })
      .returning();
    await writeAudit({
      actor,
      action: "department.create",
      targetType: "department",
      targetId: row.id,
      collegeId,
      metadata: { code: row.code },
    });
    return created(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("departments_college_code_unique")) {
      return validationError("Department code already exists in this college.");
    }
    return handleApiError(error);
  }
}
