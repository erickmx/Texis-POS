'use client';

import React from 'react';
import { StatsCards } from '@/components/inventory/StatsCards';
import { HealthSummary } from '@/components/inventory/HealthSummary';
import { ProductTable } from '@/components/inventory/ProductTable';
import { QuickFiltersClient } from '@/components/inventory/QuickFiltersClient';
import { useProducts } from '@/lib/api/hooks/useProducts';
import { useTranslation } from '@/i18n/client';

interface InventoryPageProps {
  params: Promise<{ lng: string }>;
}

export default function InventoryPage({ params }: InventoryPageProps) {
  const { lng } = React.use(params);
  const { t } = useTranslation(lng, 'common');
  const { products, isLoading } = useProducts({ page: 1, limit: 10 });

  return (
    <div className="p-12 flex flex-col gap-8 max-w-[1600px] mx-auto">
      {/* Header Section: Breadcrumbs, Title, and Stats */}
      <div className="flex items-end justify-between mb-2">
        <div className="flex flex-col gap-3">
          <nav className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/30 uppercase">
            <span>{t('sidebar.warehouse')}</span>
            <span className="opacity-30">/</span>
            <span className="text-primary-container">{t('sidebar.catalog')}</span>
          </nav>
          <h1 className="text-6xl font-display font-bold text-on-surface tracking-tight">{t('inventory.title')}</h1>
        </div>
        <StatsCards lng={lng} />
      </div>

      {/* Main Table Section */}
      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-8">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-12 w-12 bg-surface-container-high rounded-sm" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-surface-container-high rounded" />
                  <div className="h-3 w-1/4 bg-surface-container-high rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ProductTable products={products} lng={lng} />
      )}

      {/* Bottom Section: Health Summary & Quick Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-4">
        <div className="lg:col-span-8 h-full">
          <HealthSummary optimizationScore={94} urgentItemsCount={12} lng={lng} />
        </div>
        <div className="lg:col-span-4 h-full">
          <QuickFiltersClient lng={lng} />
        </div>
      </div>
    </div>
  );
}
