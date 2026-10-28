import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DEFAULT_PAGE_SIZE, normalizePagination, totalPages } from "@/lib/pagination";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
};

export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json({ data, meta: meta ?? {} }, { status });
}

export function created<T>(data: T) {
  return ok(data, {}, 201);
}

export function fail(
  code: string,
  message: string,
  status: number,
  details?: unknown[],
) {
  const body: ApiErrorBody = {
    error: { code, message, ...(details ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

export function unauthorized(message = "Please sign in to continue.") {
  return fail("UNAUTHENTICATED", message, 401);
}

export function forbidden(message = "You do not have permission to perform this action.") {
  return fail("FORBIDDEN", message, 403);
}

export function notFound(message = "The requested resource was not found.") {
  return fail("NOT_FOUND", message, 404);
}

export function conflict(message: string) {
  return fail("CONFLICT", message, 409);
}

export function validationError(error: ZodError | string, details?: unknown[]) {
  if (typeof error === "string") {
    return fail("VALIDATION_ERROR", error, 422, details);
  }
  return fail(
    "VALIDATION_ERROR",
    "Please correct the highlighted fields.",
    422,
    error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  );
}

export function serverError() {
  return fail("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaultPageSize = DEFAULT_PAGE_SIZE,
) {
  return normalizePagination({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
    defaultPageSize,
  });
}

/** Standard `meta` block returned by paginated list endpoints. */
export function paginationMeta(
  total: number,
  { page, pageSize }: { page: number; pageSize: number },
) {
  return { page, pageSize, total, totalPages: totalPages(total, pageSize) };
}
