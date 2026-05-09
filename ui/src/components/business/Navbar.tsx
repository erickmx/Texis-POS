import React from 'react';
import { Search, Plus, Bell, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

export const Navbar: React.FC = () => {
  return (
    <header className="h-20 bg-surface border-b border-solid border-outline-variant flex items-center justify-between px-8">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl px-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Icon icon={Search} size={18} className="text-on-surface-variant/30 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search inventory, SKUs, or orders..."
            className="w-full bg-[#f8f9fa] border border-solid border-outline-variant/10 rounded-sm py-3.5 pl-14 pr-4 text-sm focus:ring-2 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all outline-none text-on-surface placeholder:text-on-surface-variant/30 font-medium"
          />
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-8">
        <Button className="flex items-center gap-2 h-11 px-6 bg-primary-container hover:bg-primary transition-all shadow-sm">
          <Icon icon={Plus} size={20} className="text-white" />
          <span className="font-bold tracking-tight">New Product</span>
        </Button>

        <div className="flex items-center gap-6 pr-2 border-l border-solid border-outline-variant/30 pl-8">
          <button className="p-2.5 hover:bg-surface-container rounded-full transition-colors relative">
            <Icon icon={Bell} size={22} className="text-on-surface-variant/60" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-secondary-container rounded-full border-2 border-surface"></span>
          </button>
          <button className="p-2.5 hover:bg-surface-container rounded-full transition-colors">
            <Icon icon={Settings} size={22} className="text-on-surface-variant/60" />
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer group ml-2">
            <div className="w-11 h-11 rounded-full bg-surface-container-high overflow-hidden border-2 border-transparent group-hover:border-primary-container transition-all shadow-sm">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                alt="User Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
