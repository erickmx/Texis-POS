'use client';

import useSWR from 'swr';
import { getProductDetail } from '../products';
import { Product } from '../types';

export function useProduct(id: string | null | undefined) {
  const key = id ? ['product', id] : null;

  const { data, error, isLoading, mutate } = useSWR<Product | null>(
    key,
    () => (id ? getProductDetail(id) : null),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    product: data ?? null,
    isLoading,
    error,
    mutate,
  };
}
