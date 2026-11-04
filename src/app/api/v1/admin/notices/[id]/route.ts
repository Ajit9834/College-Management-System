import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notices } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { noticeSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["platform_admin"]);
    const { id } = await context.params;
    const parsed = noticeSchema.partial().safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [existing] = await db
      .select()
      .from(notices)
      .where(and(eq(notices.id, id), isNull(notices.collegeId)))
      .limit(1);
    if (!existing) return notFound("Platform notice not found.");

    const publishStatus = parsed.data.publishStatus ?? existing.publishStatus;
    const [row] = await db
      .update(notices)
      .set({
        title: parsed.data.title ?? existing.title,
        body: parsed.data.body ?? existing.body,
        audience: parsed.data.audience ?? existing.audience,
        publishStatus,
        publishedAt:
          publishStatus === "published"
            ? existing.publishedAt ?? new Date()
            : existing.publishedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(notices.id, id), isNull(notices.collegeId)))
      .returning();
    await writeAudit({
      actor,
      action: "notice.update",
      targetType: "notice",
      targetId: id,
      metadata: { ...parsed.data, scope: "platform" },
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
    const actor = await apiRequire(["platform_admin"]);
    const { id } = await context.params;
    const [existing] = await db
      .select()
      .from(notices)
      .where(and(eq(notices.id, id), isNull(notices.collegeId)))
      .limit(1);
    if (!existing) return notFound("Platform notice not found.");
    await db
      .delete(notices)
      .where(and(eq(notices.id, id), isNull(notices.collegeId)));
    await writeAudit({
      actor,
      action: "notice.delete",
      targetType: "notice",
      targetId: id,
      metadata: { title: existing.title, scope: "platform" },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
