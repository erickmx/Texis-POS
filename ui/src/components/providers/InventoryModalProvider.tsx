'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ModalProduct = {
  id?: string;
  name: string;
  description?: string;
  category: 'notebooks' | 'fine_pens' | 'desk_organizers' | 'adhesives';
  satCode?: string;
  buyPrice: number;
  salePrice: number;
  stockLevel: number;
  image?: string | null;
};

type ModalMode = 'create' | 'edit';

interface InventoryModalContextValue {
  isOpen: boolean;
  mode: ModalMode;
  product: ModalProduct | null;
  openCreate: () => void;
  openEdit: (product: ModalProduct) => void;
  close: () => void;
}

const InventoryModalContext = createContext<InventoryModalContextValue | null>(null);

export function useInventoryModal(): InventoryModalContextValue {
  const context = useContext(InventoryModalContext);
  if (!context) {
    throw new Error('useInventoryModal must be used within an InventoryModalProvider');
  }
  return context;
}

interface InventoryModalProviderProps {
  children: React.ReactNode;
}

export const InventoryModalProvider: React.FC<InventoryModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>('create');
  const [product, setProduct] = useState<ModalProduct | null>(null);

  const openCreate = useCallback(() => {
    setMode('create');
    setProduct(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((p: ModalProduct) => {
    setMode('edit');
    setProduct(p);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setProduct(null);
  }, []);

  const value: InventoryModalContextValue = {
    isOpen,
    mode,
    product,
    openCreate,
    openEdit,
    close,
  };

  return (
    <InventoryModalContext.Provider value={value}>
      {children}
    </InventoryModalContext.Provider>
  );
};
