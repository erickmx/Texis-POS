'use client';

import React, { useState } from 'react';
import { FilterChips } from '@/components/inventory/FilterChips';
import { Card } from '@/components/ui/Card';
import { MOCK_CATEGORIES } from '@/lib/mockData';
import { useTranslation } from '@/i18n/client';

interface QuickFiltersClientProps {
  lng: string;
}

export const QuickFiltersClient = ({ lng }: QuickFiltersClientProps) => {
  const { t } = useTranslation(lng, 'common');
  const [selectedCategory, setSelectedCategory] = useState('Notebooks');

  return (
    <Card className="h-full flex flex-col" shadow>
      <div className="flex flex-col gap-6">
        <h2 className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">{t('inventory.quick_filters')}</h2>
        <FilterChips
          categories={MOCK_CATEGORIES}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
          lng={lng}
        />
      </div>
    </Card>
  );
};
