import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { departments, programs, students, userRoles, users } from "@/db/schema";
import { ok, validationError } from "@/lib/api";
import { apiRequire, handleApiError, HttpError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/crypto";
import { parseCsv } from "@/lib/csv";
import { canManageStudents } from "@/lib/permissions";
import { studentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const importSchema = z.object({ csv: z.string().min(1).max(2_000_000) });

const canonical = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const REQUIRED_COLUMNS = [
  "fullname",
  "email",
  "registrationno",
  "departmentcode",
  "programcode",
  "currentsemester",
  "academicyear",
];

export async function POST(request: Request) {
  try {
    const actor = await apiRequire(["college_admin"]);
    if (!canManageStudents(actor)) {
      throw new HttpError(403, "FORBIDDEN", "Only college administrators can import students.");
    }
    const collegeId = requireCollegeId(actor);

    const payload = importSchema.safeParse(await request.json());
    if (!payload.success) return validationError(payload.error);

    const table = parseCsv(payload.data.csv);
    if (table.length < 2) {
      return validationError("Add a header row and at least one student row.");
    }

    const header = table[0].map(canonical);
    const columnIndex = (name: string) => header.indexOf(name);
    const missing = REQUIRED_COLUMNS.filter((name) => columnIndex(name) === -1);
    if (missing.length > 0) {
      return validationError(`Missing required columns: ${missing.join(", ")}.`);
    }

    const [departmentRows, programRows] = await Promise.all([
      db
        .select({ id: departments.id, code: departments.code })
        .from(departments)
        .where(eq(departments.collegeId, collegeId)),
      db
        .select({ id: programs.id, code: programs.code })
        .from(programs)
        .where(eq(programs.collegeId, collegeId)),
    ]);
    const departmentByCode = new Map(departmentRows.map((d) => [d.code.toUpperCase(), d.id]));
    const programByCode = new Map(programRows.map((p) => [p.code.toUpperCase(), p.id]));

    const cell = (row: string[], name: string) => {
      const index = columnIndex(name);
      return index === -1 ? "" : (row[index] ?? "").trim();
    };

    let createdCount = 0;
    const failed: { row: number; error: string }[] = [];

    for (let index = 1; index < table.length; index++) {
      const row = table[index];
      const rowNumber = index + 1;
      const departmentCode = cell(row, "departmentcode").toUpperCase();
      const programCode = cell(row, "programcode").toUpperCase();
      const departmentId = departmentByCode.get(departmentCode);
      const programId = programByCode.get(programCode);
      if (!departmentId) {
        failed.push({ row: rowNumber, error: `Unknown department code "${departmentCode}".` });
        continue;
      }
      if (!programId) {
        failed.push({ row: rowNumber, error: `Unknown program code "${programCode}".` });
        continue;
      }

      const parsed = studentSchema.safeParse({
        fullName: cell(row, "fullname"),
        email: cell(row, "email"),
        phone: cell(row, "phone") || null,
        password: cell(row, "password") || undefined,
        registrationNo: cell(row, "registrationno"),
        programId,
        departmentId,
        currentSemester: cell(row, "currentsemester"),
        academicYear: cell(row, "academicyear"),
        dateOfBirth: cell(row, "dateofbirth") || null,
        gender: cell(row, "gender") || null,
        address: cell(row, "address") || null,
        emergencyContact: cell(row, "emergencycontact") || null,
        status: cell(row, "status") || undefined,
      });
      if (!parsed.success) {
        failed.push({
          row: rowNumber,
          error: parsed.error.issues[0]?.message ?? "Invalid row.",
        });
        continue;
      }

      try {
        const [account] = await db
          .insert(users)
          .values({
            email: parsed.data.email,
            fullName: parsed.data.fullName,
            phone: parsed.data.phone ?? null,
            passwordHash: await hashPassword(parsed.data.password || "StudentPass!23"),
            status: "active",
          })
          .returning();
        await db
          .insert(userRoles)
          .values({ userId: account.id, role: "student", collegeId });
        await db.insert(students).values({
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
        });
        createdCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("users_email_unique")) {
          failed.push({ row: rowNumber, error: "An account with this email already exists." });
        } else if (message.includes("students_college_reg_unique")) {
          failed.push({ row: rowNumber, error: "Registration number already exists." });
        } else {
          failed.push({ row: rowNumber, error: "Could not create this student." });
        }
      }
    }

    await writeAudit({
      actor,
      action: "student.import",
      targetType: "student",
      targetId: null,
      collegeId,
      metadata: { created: createdCount, failed: failed.length },
    });

    return ok({ created: createdCount, failed });
  } catch (error) {
    return handleApiError(error);
  }
}
