'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Settings, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useTranslation } from '@/i18n/client';
import { useInventoryModal } from '../providers/InventoryModalProvider';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface NavbarProps {
  lng: string;
}

const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

export const Navbar: React.FC<NavbarProps> = ({ lng }) => {
  const { t } = useTranslation(lng, 'common');
  const { openCreate } = useInventoryModal();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mount-time auth read: browser storage is only readable after mount, and the
  // server-rendered HTML must match the first client render (unauthenticated),
  // so setting state in this mount effect is the intended hydration-safe pattern.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let token = getCookie('user_token');
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('user_token') || undefined;
    }
    if (token) {
      try {
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
          setUserRole(payload.role || '');
          return;
        }
      } catch {
        // Malformed token: fall through to the unauthenticated state below.
      }
    }
    setIsAuthenticated(false);
    setUserRole('');
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleAvatarClick = () => {
    if (isAuthenticated) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      router.push(`/${lng}/login`);
    }
  };

  const handleLogout = () => {
    // Clear user token cookie and localStorage
    document.cookie = 'user_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_token');
    }
    setIsAuthenticated(false);
    setUserRole('');
    setIsDropdownOpen(false);
    toast.success(t('sidebar.logout') + ' ' + t('inventory.success_edit').replace(/.*success.*/i, ''));
    
    // Redirect to login
    router.push(`/${lng}/login`);
    router.refresh();
  };

  // Close dropdown if user clicks outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = () => setIsDropdownOpen(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isDropdownOpen]);

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
            placeholder={t('navbar.search_placeholder')}
            className="w-full bg-[#f8f9fa] border border-solid border-outline-variant/10 rounded-sm py-3.5 pl-14 pr-4 text-sm focus:ring-2 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all outline-none text-on-surface placeholder:text-on-surface-variant/30 font-medium"
          />
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-8">
        <Button
          onClick={openCreate}
          className="flex items-center gap-2 h-11 px-6 bg-primary-container hover:bg-primary transition-all shadow-sm"
        >
          <Icon icon={Plus} size={20} className="text-white" />
          <span className="font-bold tracking-tight">{t('navbar.new_product')}</span>
        </Button>

        <div className="flex items-center gap-6 pr-2 border-l border-solid border-outline-variant/30 pl-8">
          <button className="p-2.5 hover:bg-surface-container rounded-full transition-colors relative">
            <Icon icon={Bell} size={22} className="text-on-surface-variant/60" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-secondary-container rounded-full border-2 border-surface"></span>
          </button>
          <button className="p-2.5 hover:bg-surface-container rounded-full transition-colors">
            <Icon icon={Settings} size={22} className="text-on-surface-variant/60" />
          </button>
          
          <div 
            className="relative"
            onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on click
          >
            <div 
              onClick={handleAvatarClick}
              className="flex items-center gap-3 cursor-pointer group ml-2"
            >
              <div className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all shadow-sm ${isAuthenticated ? 'border-primary-container group-hover:border-primary' : 'border-transparent group-hover:border-primary-container bg-surface-container-high'}`}>
                <img 
                  src={isAuthenticated ? "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" : "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"} 
                  alt="User Profile" 
                  className={`w-full h-full object-cover ${isAuthenticated ? '' : 'grayscale opacity-75'}`}
                />
              </div>
            </div>

            {isDropdownOpen && isAuthenticated && (
              <div className="absolute right-0 mt-3.5 w-48 glass border border-solid border-outline-variant/10 rounded-xl p-2 shadow-ambient z-50 flex flex-col gap-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 border-b border-solid border-outline-variant/10 mb-1">
                  Role: {userRole}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Icon icon={LogOut} size={14} className="text-red-600" />
                  {t('sidebar.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
