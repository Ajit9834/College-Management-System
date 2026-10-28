import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { fileUploads } from "@/db/schema";
import { forbidden, notFound } from "@/lib/api";
import { apiUser, handleApiError } from "@/lib/api-auth";
import { canAccessCollege, isPlatformAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    const { id } = await context.params;
    const [row] = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.id, id))
      .limit(1);
    if (!row) return notFound("File not found.");
    if (!isPlatformAdmin(user) && !canAccessCollege(user, row.collegeId)) {
      return forbidden("You cannot access this file.");
    }

    const bytes = new Uint8Array(row.data);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": row.mimeType,
        "Content-Length": String(row.sizeBytes),
        "Content-Disposition": `inline; filename="${encodeURIComponent(row.fileName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
