import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students, userRoles, users } from "@/db/schema";
import { created, ok, paginationMeta, parsePagination, validationError } from "@/lib/api";
import { apiRequire, handleApiError, HttpError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/crypto";
import { pageCollegeStudents } from "@/lib/data";
import { canManageStudents, isFacultyScoped } from "@/lib/permissions";
import { studentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequire(["college_admin", "faculty", "accounts_staff"]);
    const url = new URL(request.url);
    const collegeId = requireCollegeId(user, url.searchParams.get("collegeId"));
    const q = url.searchParams.get("q") ?? undefined;
    const { page, pageSize, offset } = parsePagination(url.searchParams);
    const { rows, total } = await pageCollegeStudents(collegeId, {
      q,
      facultyUserId: isFacultyScoped(user) ? user.id : undefined,
      limit: pageSize,
      offset,
    });
    return ok(rows, paginationMeta(total, { page, pageSize }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await apiRequire(["college_admin"]);
    if (!canManageStudents(actor)) {
      throw new HttpError(403, "FORBIDDEN", "Only college administrators can create students.");
    }
    const collegeId = requireCollegeId(actor);
    const parsed = studentSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const password = parsed.data.password || "StudentPass!23";
    const [account] = await db
      .insert(users)
      .values({
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone ?? null,
        passwordHash: await hashPassword(password),
        status: "active",
      })
      .returning();

    await db.insert(userRoles).values({
      userId: account.id,
      role: "student",
      collegeId,
    });

    const [student] = await db
      .insert(students)
      .values({
        userId: account.id,
        collegeId,
        programId: parsed.data.programId,
        departmentId: parsed.data.departmentId,
        registrationNo: parsed.data.registrationNo,
        currentSemester: parsed.data.currentSemester,
        academicYear: parsed.data.academicYear,
        dateOfBirth: parsed.data.dateOfBirth || null,
        gender: parsed.data.gender || null,
        address: parsed.data.address || null,
        emergencyContact: parsed.data.emergencyContact || null,
        status: parsed.data.status ?? "active",
      })
      .returning();

    await writeAudit({
      actor,
      action: "student.create",
      targetType: "student",
      targetId: student.id,
      collegeId,
      metadata: { registrationNo: student.registrationNo },
    });
    return created(student);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("users_email_unique")) {
      return validationError("An account with this email already exists.");
    }
    if (message.includes("students_college_reg_unique")) {
      return validationError("Registration number already exists in this college.");
    }
    return handleApiError(error);
  }
}
