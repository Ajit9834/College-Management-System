import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { listCollegeStudents } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await apiRequire(["college_admin", "faculty", "accounts_staff"]);
    const collegeId = requireCollegeId(actor);
    const students = await listCollegeStudents(collegeId);
    const csv = toCsv(
      [
        "Registration No",
        "Name",
        "Email",
        "Phone",
        "Program",
        "Department",
        "Semester",
        "Academic Year",
        "Status",
      ],
      students.map((s) => [
        s.registrationNo,
        s.fullName,
        s.email,
        s.phone,
        s.programName,
        s.departmentName,
        s.currentSemester,
        s.academicYear,
        s.status,
      ]),
    );
    return csvResponse(`college-students-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  } catch (error) {
    return handleApiError(error);
  }
}
