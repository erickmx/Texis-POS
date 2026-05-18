'use client';

import React, { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/client';
import { useInventoryModal } from '../providers/InventoryModalProvider';
import { Modal } from '../ui/Modal';
import { ProductForm } from './ProductForm';
import { ProductFormData } from '@/lib/validations/product';

interface ProductModalProps {
  lng: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({ lng }) => {
  const { isOpen, mode, product, close } = useInventoryModal();
  const { t } = useTranslation(lng, 'common');

  const handleSubmit = useCallback(
    async (data: ProductFormData) => {
      // Mock API call
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          // Simulate 90% success rate for demo
          if (Math.random() > 0.1) {
            resolve();
          } else {
            reject(new Error('Mock API error'));
          }
        }, 800);
      })
        .then(() => {
          toast.success(
            mode === 'create'
              ? t('inventory.modal.success_create')
              : t('inventory.modal.success_edit'),
            { duration: 3000 }
          );
          close();
        })
        .catch(() => {
          toast.error(t('inventory.modal.error_generic'), { duration: 4000 });
        });
    },
    [mode, t, close]
  );

  const title = mode === 'create'
    ? t('inventory.modal.create_title')
    : t('inventory.modal.edit_title');

  const subtitle = t('inventory.modal.subtitle');

  return (
    <Modal isOpen={isOpen} onClose={close} title={title} subtitle={subtitle}>
      <ProductForm
        mode={mode}
        initialData={product}
        onSubmit={handleSubmit}
        onCancel={close}
        lng={lng}
      />
    </Modal>
  );
};
