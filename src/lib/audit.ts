import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { AuthUser } from "@/lib/permissions";

export async function writeAudit(input: {
  actor: AuthUser | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  collegeId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorUserId: input.actor?.id ?? null,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    collegeId: input.collegeId ?? null,
    metadata: input.metadata ?? {},
  });
}
