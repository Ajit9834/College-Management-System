import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, colleges } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { collegeApprovalSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/**
 * Platform-admin decision on a college registration request.
 *
 * `approve` activates the college so its account can reach the college portal;
 * `reject` keeps it locked out and stores the reviewer's reason. This is the
 * only endpoint that can change `colleges.status` for a self-registered college,
 * and it is unreachable with a college-scoped session (`apiRequire` requires the
 * platform_admin role), so a college can never approve or reject itself.
 *
 * The status change and its audit entry are written in one transaction: an
 * approval can never exist without a record of who made it.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["platform_admin"]);
    const { id } = await context.params;
    const parsed = collegeApprovalSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [existing] = await db.select().from(colleges).where(eq(colleges.id, id)).limit(1);
    if (!existing) return notFound("College not found.");

    const approve = parsed.data.decision === "approve";
    const note = parsed.data.note?.trim() || null;
    const status = approve ? ("active" as const) : ("rejected" as const);

    const row = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(colleges)
        .set({ status, updatedAt: new Date() })
        .where(eq(colleges.id, id))
        .returning();

      await tx.insert(auditLogs).values({
        actorUserId: actor.id,
        action: approve ? "college.approve" : "college.reject",
        targetType: "college",
        targetId: id,
        collegeId: id,
        metadata: {
          name: updated.name,
          code: updated.code,
          previousStatus: existing.status,
          status: updated.status,
          // The rejection reason lives with the approval record it belongs to.
          note,
        },
      });

      return updated;
    });

    return ok(row);
  } catch (error) {
    return handleApiError(error);
  }
}
