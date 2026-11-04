import { and, desc, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { notices } from "@/db/schema";
import { created, ok, paginationMeta, parsePagination, validationError } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { noticeSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await apiRequire(["platform_admin"]);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(searchParams);
    const where = isNull(notices.collegeId);
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
    const actor = await apiRequire(["platform_admin"]);
    const parsed = noticeSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const publishStatus = parsed.data.publishStatus ?? "draft";
    const [row] = await db
      .insert(notices)
      .values({
        collegeId: null,
        title: parsed.data.title,
        body: parsed.data.body,
        audience: parsed.data.audience,
        attachmentId: null,
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
      metadata: { audience: row.audience, scope: "platform" },
    });
    return created(row);
  } catch (error) {
    return handleApiError(error);
  }
}
