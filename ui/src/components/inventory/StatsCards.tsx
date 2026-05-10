import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

import { useTranslation } from '@/i18n/server';

interface StatsCardsProps {
  totalItems: number;
  lowStockCount: number;
  lng: string;
}

export const StatsCards = async ({ totalItems, lowStockCount, lng }: StatsCardsProps) => {
  const { t } = await useTranslation(lng, 'common');
  return (
    <div className="flex gap-4">
      <Card className="flex items-center gap-4 py-3 px-5 min-w-[180px]" shadow>
        <div className="bg-[#e3f2fd] p-2.5 rounded-sm">
          <Icon icon={Package} size={24} className="text-primary-container" />
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-widest text-on-surface-variant/50 uppercase">{t('inventory.total_items')}</p>
          <p className="text-xl font-display font-bold text-on-surface">{totalItems.toLocaleString()}</p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 py-3 px-5 min-w-[180px]" shadow>
        <div className="bg-[#fff3e0] p-2.5 rounded-sm">
          <Icon icon={AlertTriangle} size={24} className="text-secondary-container" />
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-widest text-on-surface-variant/50 uppercase">{t('inventory.low_stock')}</p>
          <p className="text-xl font-display font-bold text-on-surface">{lowStockCount}</p>
        </div>
      </Card>
    </div>
  );
};
