'use client';

import useSWR from 'swr';
import { getSpecialRequests } from '../specialRequests';
import { SpecialOrder } from '../types';

export function useSpecialRequests() {
  const { data, error, isLoading, mutate } = useSWR<SpecialOrder[]>(
    'special-requests',
    getSpecialRequests,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    requests: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
