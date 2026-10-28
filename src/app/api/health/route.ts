import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    try {
      await ensureSeeded();
    } catch {
      // Seed is best-effort so health remains useful before migrations.
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
