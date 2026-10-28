import { eq } from "drizzle-orm";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import { ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { getSettingsMap } from "@/lib/data";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  platform_name: z.string().min(2).max(80).optional(),
  timezone: z.string().min(2).max(80).optional(),
  academic_year: z.string().min(4).max(16).optional(),
  support_email: z.string().email().optional(),
});

export async function GET() {
  try {
    await apiRequire(["platform_admin"]);
    return ok(await getSettingsMap());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await apiRequire(["platform_admin"]);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    for (const [key, value] of Object.entries(parsed.data)) {
      if (!value) continue;
      const [existing] = await db
        .select()
        .from(platformSettings)
        .where(eq(platformSettings.key, key))
        .limit(1);
      if (existing) {
        await db
          .update(platformSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(platformSettings.key, key));
      } else {
        await db.insert(platformSettings).values({ key, value });
      }
    }

    await writeAudit({
      actor,
      action: "settings.update",
      targetType: "platform_settings",
      metadata: parsed.data,
    });
    return ok(await getSettingsMap());
  } catch (error) {
    return handleApiError(error);
  }
}
