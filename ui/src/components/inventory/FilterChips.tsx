'use client';

import React from 'react';
import { useTranslation } from '@/i18n/client';

interface FilterChipsProps {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  lng: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ 
  categories, 
  selectedCategory, 
  onSelect,
  lng
}) => {
  const { t } = useTranslation(lng, 'common');

  const getCategoryLabel = (category: string) => {
    const key = category.toLowerCase().replace(/\s+/g, '_');
    return t(`inventory.categories.${key}`, { defaultValue: category });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isActive = selectedCategory === category;
        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all ${
              isActive 
                ? 'bg-primary-container text-white shadow-ambient' 
                : category === 'Out of Stock'
                ? 'bg-[#fff3e0] text-[#f57c00] hover:bg-[#ffe0b2]'
                : category === 'New Season'
                ? 'bg-[#e3f2fd] text-[#1976d2] hover:bg-[#bbdefb]'
                : 'bg-[#f8f9fa] border border-solid border-outline-variant/10 text-on-surface-variant/70 hover:bg-surface-container transition-colors'
            }`}
          >
            {getCategoryLabel(category)}
          </button>
        );

      })}
    </div>
  );
};
