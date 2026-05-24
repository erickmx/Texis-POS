'use client';

import React, { useCallback } from 'react';
import { useTranslation } from '@/i18n/client';
import { useInventoryModal } from '../providers/InventoryModalProvider';
import { Modal } from '../ui/Modal';
import { ProductForm } from './ProductForm';
import { useProduct } from '@/lib/api/hooks/useProduct';
import { useSWRConfig } from 'swr';

interface ProductModalProps {
  lng: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({ lng }) => {
  const { isOpen, mode, product, close } = useInventoryModal();
  const { t } = useTranslation(lng, 'common');
  const { mutate } = useSWRConfig();

  const productId = mode === 'edit' && product ? product.id : null;
  const { product: freshProduct, isLoading } = useProduct(productId);

  const handleSuccess = useCallback(() => {
    // Filter-based mutate matches all keys starting with 'products'
    // because paginated keys are ['products', { page, limit }]
    mutate(
      (key) => Array.isArray(key) && typeof key[0] === 'string' && key[0] === 'products'
    );
    mutate(['products/total']);
    mutate(['products/stock/low']);
  }, [mutate]);

  const title = mode === 'create'
    ? t('inventory.modal.create_title')
    : t('inventory.modal.edit_title');

  const subtitle = t('inventory.modal.subtitle');

  const displayProduct = mode === 'edit' && freshProduct ? freshProduct : product;

  return (
    <Modal isOpen={isOpen} onClose={close} title={title} subtitle={subtitle}>
      {mode === 'edit' && isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container" />
        </div>
      ) : (
        <ProductForm
          mode={mode}
          initialData={displayProduct}
          onSuccess={handleSuccess}
          onCancel={close}
          lng={lng}
        />
      )}
    </Modal>
  );
};
