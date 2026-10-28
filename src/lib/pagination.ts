/**
 * Shared pagination helpers used by both route handlers (query strings) and
 * server components (search params).
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export type Pagination = {
  page: number;
  pageSize: number;
  offset: number;
};

function toInt(value: string | number | null | undefined, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export function normalizePagination(
  input: {
    page?: string | number | null;
    pageSize?: string | number | null;
    defaultPageSize?: number;
  } = {},
): Pagination {
  const fallbackSize = input.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const page = Math.max(1, toInt(input.page, 1) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, toInt(input.pageSize, fallbackSize) || fallbackSize),
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, pageSize)));
}

/**
 * Builds a link back to a list page while preserving the active filters. Only
 * the `page` parameter is rewritten, and it is dropped on the first page so the
 * canonical URL stays clean.
 */
export function buildPageHref(
  basePath: string,
  params: Record<string, string | number | undefined | null>,
  page: number,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}
