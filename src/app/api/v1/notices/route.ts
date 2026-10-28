import { ok } from "@/lib/api";
import { apiUser, handleApiError } from "@/lib/api-auth";
import { listNoticesForUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiUser();
    return ok(await listNoticesForUser(user));
  } catch (error) {
    return handleApiError(error);
  }
}
