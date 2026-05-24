'use client';

import useSWR from 'swr';
import { getTotalProducts, getStockLowProducts } from '../products';
import { Product } from '../types';

export function useStats() {
  const {
    data: total,
    error: totalError,
    isLoading: totalLoading,
  } = useSWR<number>(['products/total'], () => getTotalProducts(), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const {
    data: lowStock,
    error: lowStockError,
    isLoading: lowStockLoading,
  } = useSWR<Product[]>(['products/stock/low'], () => getStockLowProducts(), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const isLoading = totalLoading || lowStockLoading;
  const error = totalError || lowStockError;

  return {
    total: total ?? 0,
    lowStockCount: lowStock?.length ?? 0,
    isLoading,
    error,
  };
}
