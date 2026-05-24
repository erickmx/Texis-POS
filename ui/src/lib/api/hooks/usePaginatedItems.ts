'use client';

import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { PaginatedResponse } from '../types';

interface UsePaginatedItemsOptions<T> {
  initialData?: PaginatedResponse<T>;
  limit?: number;
}

export function usePaginatedItems<T>(options: UsePaginatedItemsOptions<T> = {}) {
  const limit = options.limit ?? DEFAULT_PAGE_SIZE;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    if (!options.initialData?.meta) return 1;
    return options.initialData.meta.totalPages || 1;
  }, [options.initialData]);

  const hasMore = currentPage < totalPages;

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  return {
    data: options.initialData?.data ?? [],
    currentPage,
    totalPages,
    hasMore,
    limit,
    goToPage,
    nextPage,
    prevPage,
  };
}
