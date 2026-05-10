'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  History, 
  TrendingUp,
  HelpCircle, 
  LogOut,
  BookOpen
} from 'lucide-react';
import { Icon } from '../ui/Icon';
import { useTranslation } from '@/i18n/client';

interface SidebarProps {
  lng: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ lng }) => {
  const pathname = usePathname();
  const { t } = useTranslation(lng, 'common');

  const navItems = [
    { name: t('sidebar.overview'), icon: LayoutDashboard, href: `/${lng}/overview` },
    { name: t('sidebar.catalog'), icon: Package, href: `/${lng}/inventory` },
    { name: t('sidebar.stock_levels'), icon: TrendingUp, href: `/${lng}/stock` },
    { name: t('sidebar.analytics'), icon: BarChart3, href: `/${lng}/analytics` },
    { name: t('sidebar.history'), icon: History, href: `/${lng}/history` },
  ];

  const secondaryItems = [
    { name: t('sidebar.help'), icon: HelpCircle, href: `/${lng}/help` },
    { name: t('sidebar.logout'), icon: LogOut, href: `/${lng}/logout` },
  ];

  return (
    <aside className="w-64 h-full bg-surface border-r border-solid border-outline-variant flex flex-col py-8 px-4">
      {/* Branding */}
      <div className="flex items-center gap-4 px-2 mb-16">
        <div className="bg-primary-container p-2.5 rounded-sm shadow-md">
          <Icon icon={BookOpen} size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-primary font-display font-bold text-xl leading-none tracking-tight">Talavera Folio</h1>
          <p className="text-[10px] tracking-[0.2em] text-on-surface-variant/60 font-bold mt-1 uppercase">{t('sidebar.warehouse')}</p>
        </div>
      </div>
...

      {/* Primary Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <div 
              key={item.name}
              className={`flex items-center gap-4 px-5 py-4 rounded-sm transition-all cursor-pointer group ${
                isActive ? 'bg-[#f1f6ff]' : 'hover:bg-surface-container-low'
              }`}
            >
              <Icon 
                icon={item.icon} 
                size={22} 
                className={isActive ? 'text-primary-container' : 'text-on-surface-variant/60 group-hover:text-on-surface'} 
              />
              <span className={`text-sm tracking-tight ${
                isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant/60 font-medium group-hover:text-on-surface'
              }`}>
                {item.name}
              </span>
            </div>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="pt-8 border-t border-solid border-outline-variant space-y-2">
        {secondaryItems.map((item) => (
          <div 
            key={item.name}
            className="flex items-center gap-3 px-4 py-3 rounded-sm hover:bg-surface-container transition-colors cursor-pointer group"
          >
            <Icon icon={item.icon} size={20} className="text-on-surface-variant group-hover:text-on-surface" />
            <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
};
