"use client";

import { useMemo, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

export function usePagination(initialPage = 1, initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  function nextPage() {
    setPage((p) => Math.min(totalPages, p + 1));
  }
  function prevPage() {
    setPage((p) => Math.max(1, p - 1));
  }

  return {
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
    setTotal,
    nextPage,
    prevPage,
  };
}
