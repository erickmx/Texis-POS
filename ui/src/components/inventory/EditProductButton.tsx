'use client';

import React, { useCallback } from 'react';
import { Pencil } from 'lucide-react';
import { Icon } from '../ui/Icon';
import { useInventoryModal, ModalProduct } from '../providers/InventoryModalProvider';

interface EditProductButtonProps {
  product: ModalProduct;
}

export const EditProductButton: React.FC<EditProductButtonProps> = ({ product }) => {
  const { openEdit } = useInventoryModal();

  const handleClick = useCallback(() => {
    openEdit(product);
  }, [openEdit, product]);

  return (
    <button
      onClick={handleClick}
      className="p-2 hover:bg-surface-container rounded-sm transition-colors opacity-0 group-hover:opacity-100"
      aria-label="Edit product"
    >
      <Icon icon={Pencil} size={16} className="text-on-surface-variant hover:text-primary" />
    </button>
  );
};
