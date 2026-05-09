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

const navItems = [
  { name: 'Overview', icon: LayoutDashboard, href: '/overview' },
  { name: 'Catalog', icon: Package, href: '/inventory' },
  { name: 'Stock Levels', icon: TrendingUp, href: '/stock' },
  { name: 'Analytics', icon: BarChart3, href: '/analytics' },
  { name: 'History', icon: History, href: '/history' },
];

const secondaryItems = [
  { name: 'Help', icon: HelpCircle, href: '/help' },
  { name: 'Logout', icon: LogOut, href: '/logout' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full bg-surface border-r border-solid border-outline-variant flex flex-col py-8 px-4">
      {/* Branding */}
      <div className="flex items-center gap-4 px-2 mb-16">
        <div className="bg-primary-container p-2.5 rounded-sm shadow-md">
          <Icon icon={BookOpen} size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-primary font-display font-bold text-xl leading-none tracking-tight">Talavera Folio</h1>
          <p className="text-[10px] tracking-[0.2em] text-on-surface-variant/60 font-bold mt-1">MAIN WAREHOUSE</p>
        </div>
      </div>

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
