import React from 'react';

interface FilterChipsProps {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ 
  categories, 
  selectedCategory, 
  onSelect 
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isActive = selectedCategory === category;
        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`px-5 py-2 rounded-full text-[11px] font-bold tracking-tight transition-all ${
              isActive 
                ? 'bg-primary-container text-white shadow-ambient' 
                : category === 'Out of Stock'
                ? 'bg-[#ffe0b2] text-[#f57c00] hover:bg-[#ffcc80]'
                : category === 'New Season'
                ? 'bg-[#e3f2fd] text-[#1976d2] hover:bg-[#bbdefb]'
                : 'bg-[#f3f4f6] text-on-surface-variant/70 hover:bg-surface-container transition-colors'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
};
