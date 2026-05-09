'use client';

import React, { useState } from 'react';
import { StatsCards } from '@/components/inventory/StatsCards';
import { FilterChips } from '@/components/inventory/FilterChips';
import { HealthSummary } from '@/components/inventory/HealthSummary';
import { ProductTable } from '@/components/inventory/ProductTable';
import { Card } from '@/components/ui/Card';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/lib/mockData';

export default function InventoryPage() {
  const [selectedCategory, setSelectedCategory] = useState('Notebooks');

  return (
    <div className="p-12 flex flex-col gap-12 max-w-[1600px] mx-auto">
      {/* Header Section: Breadcrumbs, Title, and Stats */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-3">
          <nav className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/30 uppercase">
            <span>Inventory</span>
            <span className="opacity-30">/</span>
            <span className="text-primary-container">Catalog</span>
          </nav>
          <h1 className="text-6xl font-display font-bold text-on-surface tracking-tight">Product Catalog</h1>
        </div>
        <StatsCards totalItems={1284} lowStockCount={12} />
      </div>

      {/* Main Table Section */}
      <ProductTable products={MOCK_PRODUCTS} />

      {/* Bottom Section: Health Summary & Quick Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <HealthSummary optimizationScore={94} urgentItemsCount={12} />
        </div>
        <div className="lg:col-span-4">
          <Card className="h-full" shadow>
            <div className="flex flex-col gap-6">
              <h2 className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Quick Filters</h2>
              <FilterChips 
                categories={MOCK_CATEGORIES} 
                selectedCategory={selectedCategory} 
                onSelect={setSelectedCategory} 
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
