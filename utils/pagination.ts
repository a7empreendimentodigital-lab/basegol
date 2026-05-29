export const DEFAULT_PAGE_SIZE = 50;

export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export function normalizePagination({ page = 1, pageSize = DEFAULT_PAGE_SIZE }: PaginationInput) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.min(100, Math.floor(pageSize))
      : DEFAULT_PAGE_SIZE;
  const skip = (safePage - 1) * safePageSize;
  return { page: safePage, pageSize: safePageSize, skip };
}

export function paginationMeta(total: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { total, page, pageSize, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}
