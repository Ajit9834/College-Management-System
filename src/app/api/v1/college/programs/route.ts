import { eq } from "drizzle-orm";
import { db } from "@/db";
import { programs } from "@/db/schema";
import { created, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { programSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequire(["college_admin", "faculty", "accounts_staff"]);
    const collegeId = requireCollegeId(user);
    const rows = await db.select().from(programs).where(eq(programs.collegeId, collegeId));
    return ok(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await apiRequire(["college_admin"]);
    const collegeId = requireCollegeId(actor);
    const parsed = programSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const [row] = await db
      .insert(programs)
      .values({ ...parsed.data, collegeId })
      .returning();
    await writeAudit({
      actor,
      action: "program.create",
      targetType: "program",
      targetId: row.id,
      collegeId,
    });
    return created(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("programs_college_code_unique")) {
      return validationError("Program code already exists in this college.");
    }
    return handleApiError(error);
  }
}
