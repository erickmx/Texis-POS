import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

import { useTranslation } from '@/i18n/server';

interface HealthSummaryProps {
  optimizationScore: number;
  urgentItemsCount: number;
  lng: string;
}

export const HealthSummary = async ({ 
  optimizationScore, 
  urgentItemsCount,
  lng
}: HealthSummaryProps) => {
  const { t } = await useTranslation(lng, 'common');
  return (
    <Card className="bg-talavera relative overflow-hidden" shadow>
      {/* Decorative background pattern */}
      <div className="absolute top-0 right-0 w-64 h-full opacity-10 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full text-white fill-current">
          <path d="M40 40 L160 40 L40 160 L160 160" stroke="currentColor" strokeWidth="20" fill="none" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col gap-6 max-w-lg">
        <div>
          <h2 className="text-white font-display font-bold text-2xl mb-2">{t('inventory.health_summary.title')}</h2>
          <p className="text-white/80 text-sm leading-relaxed">
            {t('inventory.health_summary.optimized', { score: optimizationScore }).split('<1>')[0]}
            <span className="text-white font-bold">{optimizationScore}% optimized</span>
            {t('inventory.health_summary.optimized', { score: optimizationScore }).split('</1>')[1]}
            <br />
            {t('inventory.health_summary.urgent_reorder', { count: urgentItemsCount }).split('<1>')[0]}
            <span className="text-white font-bold">{urgentItemsCount} items</span>
            {t('inventory.health_summary.urgent_reorder', { count: urgentItemsCount }).split('</1>')[1]}
          </p>
        </div>
        
        <Button variant="ghost" className="bg-white text-primary-container border-none hover:bg-white/90 w-fit h-10 px-6 uppercase tracking-wider text-xs font-bold">
          {t('inventory.health_summary.view_urgent')}
        </Button>
      </div>
    </Card>
  );
};
