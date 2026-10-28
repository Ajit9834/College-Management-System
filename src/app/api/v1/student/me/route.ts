import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students, users } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { getStudentByUserId } from "@/lib/data";
import { studentProfileUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequire(["student"]);
    const profile = await getStudentByUserId(user.id);
    if (!profile) return notFound("Student profile not found.");
    return ok(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await apiRequire(["student"]);
    const parsed = studentProfileUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const profile = await getStudentByUserId(user.id);
    if (!profile) return notFound("Student profile not found.");

    await db
      .update(users)
      .set({ phone: parsed.data.phone ?? user.phone, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    await db
      .update(students)
      .set({
        address: parsed.data.address ?? profile.student.address,
        emergencyContact: parsed.data.emergencyContact ?? profile.student.emergencyContact,
        updatedAt: new Date(),
      })
      .where(eq(students.id, profile.student.id));

    return ok(await getStudentByUserId(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
