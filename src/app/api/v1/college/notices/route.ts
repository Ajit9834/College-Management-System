import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notices } from "@/db/schema";
import { created, ok, paginationMeta, parsePagination, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { noticeSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequire(["college_admin", "faculty", "accounts_staff"]);
    const collegeId = requireCollegeId(user);
    const url = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(url.searchParams);
    const where = eq(notices.collegeId, collegeId);
    const [rows, counted] = await Promise.all([
      db
        .select()
        .from(notices)
        .where(where)
        .orderBy(desc(notices.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(notices).where(where),
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
    const parsed = noticeSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const publishStatus = parsed.data.publishStatus ?? "draft";
    const [row] = await db
      .insert(notices)
      .values({
        collegeId,
        title: parsed.data.title,
        body: parsed.data.body,
        audience: parsed.data.audience,
        attachmentId: parsed.data.attachmentId ?? null,
        publishStatus,
        publishedAt: publishStatus === "published" ? new Date() : null,
        createdBy: actor.id,
      })
      .returning();
    await writeAudit({
      actor,
      action: "notice.create",
      targetType: "notice",
      targetId: row.id,
      collegeId,
    });
    return created(row);
  } catch (error) {
    return handleApiError(error);
  }
}
