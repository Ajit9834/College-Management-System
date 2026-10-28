import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notices } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { noticeSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = noticeSchema.partial().safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [existing] = await db
      .select()
      .from(notices)
      .where(and(eq(notices.id, id), eq(notices.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Notice not found.");

    const publishStatus = parsed.data.publishStatus ?? existing.publishStatus;
    const [row] = await db
      .update(notices)
      .set({
        title: parsed.data.title ?? existing.title,
        body: parsed.data.body ?? existing.body,
        audience: parsed.data.audience ?? existing.audience,
        attachmentId:
          parsed.data.attachmentId === undefined
            ? existing.attachmentId
            : parsed.data.attachmentId,
        publishStatus,
        publishedAt:
          publishStatus === "published"
            ? existing.publishedAt ?? new Date()
            : existing.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(notices.id, id))
      .returning();

    await writeAudit({
      actor,
      action: "notice.update",
      targetType: "notice",
      targetId: id,
      collegeId,
      metadata: parsed.data,
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
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const [existing] = await db
      .select()
      .from(notices)
      .where(and(eq(notices.id, id), eq(notices.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Notice not found.");
    await db.delete(notices).where(eq(notices.id, id));
    await writeAudit({
      actor,
      action: "notice.delete",
      targetType: "notice",
      targetId: id,
      collegeId,
      metadata: { title: existing.title },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
