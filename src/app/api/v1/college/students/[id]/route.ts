import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { students, userRoles, users } from "@/db/schema";
import { notFound, ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, HttpError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { getStudentById } from "@/lib/data";
import { canAccessCollege, canManageStudents } from "@/lib/permissions";
import { studentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiRequire(["college_admin", "faculty", "accounts_staff"]);
    const { id } = await context.params;
    const row = await getStudentById(id);
    if (!row || !canAccessCollege(user, row.student.collegeId)) {
      return notFound("Student not found.");
    }
    return ok(row);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await apiRequire(["college_admin"]);
    if (!canManageStudents(actor)) {
      throw new HttpError(403, "FORBIDDEN", "Only college administrators can update students.");
    }
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const parsed = studentSchema.partial().safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [existing] = await db.select().from(students).where(eq(students.id, id)).limit(1);
    if (!existing || existing.collegeId !== collegeId) return notFound("Student not found.");

    const [student] = await db
      .update(students)
      .set({
        programId: parsed.data.programId ?? existing.programId,
        departmentId: parsed.data.departmentId ?? existing.departmentId,
        registrationNo: parsed.data.registrationNo ?? existing.registrationNo,
        currentSemester: parsed.data.currentSemester ?? existing.currentSemester,
        academicYear: parsed.data.academicYear ?? existing.academicYear,
        dateOfBirth: parsed.data.dateOfBirth ?? existing.dateOfBirth,
        gender: parsed.data.gender ?? existing.gender,
        address: parsed.data.address ?? existing.address,
        emergencyContact: parsed.data.emergencyContact ?? existing.emergencyContact,
        photoId: parsed.data.photoId === undefined ? existing.photoId : parsed.data.photoId,
        status: parsed.data.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(students.id, id))
      .returning();

    if (parsed.data.fullName || parsed.data.phone !== undefined) {
      await db
        .update(users)
        .set({
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.userId));
    }

    await writeAudit({
      actor,
      action: "student.update",
      targetType: "student",
      targetId: id,
      collegeId,
      metadata: parsed.data,
    });
    return ok(student);
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
    if (!canManageStudents(actor)) {
      throw new HttpError(403, "FORBIDDEN", "Only college administrators can delete students.");
    }
    const collegeId = requireCollegeId(actor);
    const { id } = await context.params;
    const [existing] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, id), eq(students.collegeId, collegeId)))
      .limit(1);
    if (!existing) return notFound("Student not found.");

    await db.transaction(async (tx) => {
      await tx.delete(students).where(eq(students.id, id));
      // The linked login exists only for this student, so remove it as well.
      const roles = await tx
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, existing.userId));
      if (roles.every((r) => r.role === "student")) {
        await tx.delete(users).where(eq(users.id, existing.userId));
      }
    });

    await writeAudit({
      actor,
      action: "student.delete",
      targetType: "student",
      targetId: id,
      collegeId,
      metadata: { registrationNo: existing.registrationNo, userId: existing.userId },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
