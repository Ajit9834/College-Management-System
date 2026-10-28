import { db } from "@/db";
import { fileUploads } from "@/db/schema";
import { created, validationError } from "@/lib/api";
import { apiRequire, handleApiError, requireCollegeId } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "application/zip",
]);

function sanitizeFileName(name: string): string {
  const base = name.replace(/[\\/]+/g, "_").replace(/[\r\n"]/g, "").trim();
  return (base || "file").slice(0, 200);
}

export async function POST(request: Request) {
  try {
    const actor = await apiRequire(["college_admin", "faculty", "accounts_staff"]);
    const collegeId = requireCollegeId(actor);

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return validationError("Uploads must be sent as multipart form data.");
    }

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return validationError("Choose a file to upload.");
    }
    if (file.size > MAX_BYTES) {
      return validationError("Files must be 5 MB or smaller.");
    }
    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return validationError("This file type is not allowed.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const [row] = await db
      .insert(fileUploads)
      .values({
        collegeId,
        uploadedBy: actor.id,
        fileName: sanitizeFileName(file.name),
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        data: buffer,
      })
      .returning({
        id: fileUploads.id,
        fileName: fileUploads.fileName,
        mimeType: fileUploads.mimeType,
        sizeBytes: fileUploads.sizeBytes,
      });

    await writeAudit({
      actor,
      action: "file.upload",
      targetType: "file_upload",
      targetId: row.id,
      collegeId,
      metadata: { fileName: row.fileName, sizeBytes: row.sizeBytes },
    });

    return created({ ...row, url: `/api/v1/uploads/${row.id}` });
  } catch (error) {
    return handleApiError(error);
  }
}
