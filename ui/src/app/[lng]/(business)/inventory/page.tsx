import React from 'react';
import { StatsCards } from '@/components/inventory/StatsCards';
import { HealthSummary } from '@/components/inventory/HealthSummary';
import { ProductTable } from '@/components/inventory/ProductTable';
import { QuickFiltersClient } from '@/components/inventory/QuickFiltersClient';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { useTranslation } from '@/i18n/server';

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ lng: string }>;
}) {
  const { lng } = await params;
  const { t } = await useTranslation(lng, 'common');

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
        <StatsCards totalItems={1284} lowStockCount={12} lng={lng} />
      </div>

      {/* Main Table Section */}
      <ProductTable products={MOCK_PRODUCTS} lng={lng} />

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
