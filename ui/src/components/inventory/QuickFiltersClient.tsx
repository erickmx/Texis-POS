'use client';

import React, { useState } from 'react';
import { FilterChips } from '@/components/inventory/FilterChips';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/i18n/client';
import useSWR from 'swr';
import { getCategories } from '@/lib/api/categories';
import { Category } from '@/lib/api/types';

interface QuickFiltersClientProps {
  lng: string;
}

export const QuickFiltersClient = ({ lng }: QuickFiltersClientProps) => {
  const { t } = useTranslation(lng, 'common');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: categories } = useSWR<Category[]>(['categories'], () => getCategories(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const categoryNames = categories?.map((c) => c.name) ?? [];

  return (
    <Card className="h-full flex flex-col" shadow>
      <div className="flex flex-col gap-6">
        <h2 className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">{t('inventory.quick_filters')}</h2>
        {categoryNames.length > 0 ? (
          <FilterChips
            categories={categoryNames}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
            lng={lng}
          />
        ) : (
          <div className="space-y-3 animate-pulse">
            <div className="h-8 w-24 bg-surface-container-low rounded-lg" />
            <div className="h-8 w-32 bg-surface-container-low rounded-lg" />
            <div className="h-8 w-20 bg-surface-container-low rounded-lg" />
          </div>
        )}
      </div>
    </Card>
  );
};
