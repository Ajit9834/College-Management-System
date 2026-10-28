import { apiRequire, handleApiError } from "@/lib/api-auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { adminDashboardStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await apiRequire(["platform_admin"]);
    const { collegeRows } = await adminDashboardStats();
    const csv = toCsv(
      ["Name", "Code", "City", "State", "Status", "Established", "Email", "Phone", "Website"],
      collegeRows.map((c) => [
        c.name,
        c.code,
        c.city,
        c.state,
        c.status,
        c.establishedYear,
        c.email,
        c.phone,
        c.website,
      ]),
    );
    return csvResponse(`platform-colleges-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  } catch (error) {
    return handleApiError(error);
  }
}
