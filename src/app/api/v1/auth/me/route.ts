import { ok, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { portalForUser } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return ok({ ...user, portal: portalForUser(user) });
}
