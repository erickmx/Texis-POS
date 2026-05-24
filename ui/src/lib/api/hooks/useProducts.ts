'use client';

import useSWR from 'swr';
import { getProductsPaginated, ProductListParams } from '../products';
import { Product, PaginatedResponse } from '../types';

export function useProducts(params: ProductListParams = {}) {
  const key = ['products', params];

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Product>>(
    key,
    () => getProductsPaginated(params),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    products: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}
