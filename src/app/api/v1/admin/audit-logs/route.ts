import { ok, parsePagination } from "@/lib/api";
import { apiRequire, handleApiError } from "@/lib/api-auth";
import { listAuditLogs } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await apiRequire(["platform_admin"]);
    const url = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(url.searchParams);
    const rows = await listAuditLogs({
      action: url.searchParams.get("action")?.trim() || undefined,
      actor: url.searchParams.get("actor")?.trim() || undefined,
      from: url.searchParams.get("from")?.trim() || undefined,
      to: url.searchParams.get("to")?.trim() || undefined,
      limit: pageSize,
      offset,
    });
    return ok(rows, { page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}
