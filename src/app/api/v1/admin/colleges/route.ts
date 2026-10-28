import { asc, desc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { colleges } from "@/db/schema";
import { created, ok, paginationMeta, parsePagination, validationError } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { collegeSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await apiRequire(["platform_admin"]);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(searchParams);
    const q = searchParams.get("q")?.trim();
    const where = q
      ? or(ilike(colleges.name, `%${q}%`), ilike(colleges.code, `%${q}%`))
      : undefined;
    const [rows, counted] = await Promise.all([
      db
        .select()
        .from(colleges)
        .where(where)
        .orderBy(desc(colleges.createdAt), asc(colleges.id))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(colleges).where(where),
    ]);
    const total = counted?.[0]?.count ?? 0;
    return ok(rows, paginationMeta(total, { page, pageSize }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await apiRequire(["platform_admin"]);
    const parsed = collegeSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [row] = await db
      .insert(colleges)
      .values({
        ...parsed.data,
        email: parsed.data.email || null,
        updatedAt: new Date(),
      })
      .returning();
    await writeAudit({
      actor,
      action: "college.create",
      targetType: "college",
      targetId: row.id,
      collegeId: row.id,
      metadata: { name: row.name, code: row.code },
    });
    return created(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("colleges_code_unique")) {
      return validationError("A college with this code already exists.");
    }
    return handleApiError(error);
  }
}
