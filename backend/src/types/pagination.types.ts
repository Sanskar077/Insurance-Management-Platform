export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function buildPaginationMeta(
  totalRecords: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  return {
    currentPage: page,
    totalPages,
    totalRecords,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}
