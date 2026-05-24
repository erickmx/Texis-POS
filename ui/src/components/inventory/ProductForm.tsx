'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useForm, Controller, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@/i18n/client';
import { productSchema, ProductFormData } from '@/lib/validations/product';
import { uploadImage } from '@/lib/api/storage';
import { createProduct, updateProduct } from '@/lib/api/products';
import { getCategories } from '@/lib/api/categories';
import { Button } from '../ui/Button';
import { ImageDropZone } from './ImageDropZone';
import { ModalProduct } from '../providers/InventoryModalProvider';
import { TrendingUp } from 'lucide-react';
import { Icon } from '../ui/Icon';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import { Category } from '@/lib/api/types';

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialData?: ModalProduct | null;
  onSuccess?: () => void;
  onCancel: () => void;
  lng: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  mode,
  initialData,
  onSuccess,
  onCancel,
  lng,
}) => {
  const { t } = useTranslation(lng, 'common');
  const abortRef = useRef<AbortController | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories } = useSWR<Category[]>(['categories'], () => getCategories(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const defaultValues: Partial<ProductFormData> = useMemo(
    () => ({
      name: initialData?.name || '',
      description: initialData?.description || '',
      categoryIds: initialData?.categories?.map((c) => c.id) || [],
      satCode: initialData?.satCode || '',
      buyPrice: initialData?.buyPrice || undefined,
      salePrice: initialData?.salePrice || undefined,
      stock: initialData?.stockLevel ?? undefined,
      image: initialData?.image || null,
    }),
    [initialData]
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
    defaultValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, []);

  const buyPrice = watch('buyPrice');
  const salePrice = watch('salePrice');
  const selectedCategoryIds = watch('categoryIds') || [];

  const profitMargin = useMemo(() => {
    const buy = Number(buyPrice);
    const sale = Number(salePrice);
    if (!buy || buy <= 0) return null;
    const percent = ((sale - buy) / buy) * 100;
    const amount = sale - buy;
    return { percent: percent.toFixed(1), amount: amount.toFixed(2) };
  }, [buyPrice, salePrice]);

  const getErrorMessage = (errorKey?: string): string | undefined => {
    if (!errorKey) return undefined;
    return t(errorKey);
  };

  const toggleCategory = (id: string) => {
    const current = selectedCategoryIds;
    if (current.includes(id)) {
      setValue('categoryIds', current.filter((c) => c !== id));
    } else {
      setValue('categoryIds', [...current, id]);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    const signal = abortRef.current?.signal;
    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined;
      if (data.image instanceof File) {
        imageUrl = await uploadImage(data.image, signal);
      } else if (typeof data.image === 'string') {
        imageUrl = data.image;
      }

      const dto = {
        name: data.name,
        description: data.description,
        sku: '',
        satCode: data.satCode || '',
        buyPrice: data.buyPrice,
        salePrice: data.salePrice,
        stockLevel: data.stock,
        image: imageUrl,
        categoryIds: data.categoryIds,
      };

      if (mode === 'create') {
        await createProduct(dto, signal);
        toast.success(t('inventory.modal.success_create'), { duration: 3000 });
      } else if (initialData?.id) {
        await updateProduct(initialData.id, dto, signal);
        toast.success(t('inventory.modal.success_edit'), { duration: 3000 });
      }

      onSuccess?.();
      onCancel();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : t('inventory.modal.error_generic');
      toast.error(message, { duration: 4000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Image Drop Zone - TOP */}
      <div className="flex flex-col gap-1.5">
        <Controller
          name="image"
          control={control}
          render={({ field }) => (
            <ImageDropZone
              value={field.value}
              onChange={field.onChange}
              error={getErrorMessage(errors.image?.message)}
              lng={lng}
            />
          )}
        />
      </div>

      {/* Product Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-on-surface-variant">
          {t('inventory.modal.name')}
        </label>
        <input
          id="name"
          type="text"
          placeholder={t('inventory.modal.name_placeholder')}
          className={`w-full bg-surface-container-lowest border rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-on-surface-variant/30 ${
            errors.name
              ? 'border-[#e53935] focus:border-[#e53935] focus:ring-2 focus:ring-[#e53935]/10'
              : 'border-outline-variant/15 focus:border-primary-container focus:ring-2 focus:ring-primary-container/10'
          }`}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-[#e53935] font-medium">{getErrorMessage(errors.name.message)}</p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-on-surface-variant">
          {t('inventory.modal.description')}
        </label>
        <textarea
          id="description"
          placeholder={t('inventory.modal.description_placeholder')}
          rows={3}
          className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-on-surface-variant/30 focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 resize-none"
          {...register('description')}
        />
      </div>

      {/* Category Multi-Select + SAT Fiscal Code - 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-on-surface-variant">
            {t('inventory.modal.category')}
          </label>
          <div className="flex flex-wrap gap-2">
            {categories?.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategoryIds.includes(cat.id)
                    ? 'bg-primary-container text-white'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {errors.categoryIds && (
            <p className="text-xs text-[#e53935] font-medium">{getErrorMessage(errors.categoryIds.message)}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="satCode" className="text-sm font-medium text-on-surface-variant">
            {t('inventory.modal.sat_code')}
          </label>
          <input
            id="satCode"
            type="text"
            inputMode="numeric"
            maxLength={8}
            placeholder={t('inventory.modal.sat_code_placeholder')}
            className={`w-full bg-surface-container-lowest border rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-on-surface-variant/30 ${
              errors.satCode
                ? 'border-[#e53935] focus:border-[#e53935] focus:ring-2 focus:ring-[#e53935]/10'
                : 'border-outline-variant/15 focus:border-primary-container focus:ring-2 focus:ring-primary-container/10'
            }`}
            {...register('satCode')}
          />
          {errors.satCode && (
            <p className="text-xs text-[#e53935] font-medium">{getErrorMessage(errors.satCode.message)}</p>
          )}
        </div>
      </div>

      {/* Pricing & Stock Section */}
      <div className="rounded-xl bg-surface-container-low p-6 flex flex-col gap-5">
        <h3 className="text-base font-display font-bold text-primary-container">
          {t('inventory.modal.pricing_stock')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Buy Price */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="buyPrice" className="text-sm font-medium text-on-surface-variant">
              {t('inventory.modal.buy_price')}
            </label>
            <input
              id="buyPrice"
              type="number"
              step="0.01"
              min={0}
              placeholder="$ 0.00"
              className={`w-full bg-surface-container-lowest border rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-on-surface-variant/30 ${
                errors.buyPrice
                  ? 'border-[#e53935] focus:border-[#e53935] focus:ring-2 focus:ring-[#e53935]/10'
                  : 'border-outline-variant/15 focus:border-primary-container focus:ring-2 focus:ring-primary-container/10'
              }`}
              {...register('buyPrice')}
            />
            {errors.buyPrice && (
              <p className="text-xs text-[#e53935] font-medium">{getErrorMessage(errors.buyPrice.message)}</p>
            )}
          </div>

          {/* Sale Price */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="salePrice" className="text-sm font-medium text-on-surface-variant">
              {t('inventory.modal.sale_price')}
            </label>
            <input
              id="salePrice"
              type="number"
              step="0.01"
              min={0}
              placeholder="$ 0.00"
              className={`w-full bg-surface-container-lowest border rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-on-surface-variant/30 ${
                errors.salePrice
                  ? 'border-[#e53935] focus:border-[#e53935] focus:ring-2 focus:ring-[#e53935]/10'
                  : 'border-outline-variant/15 focus:border-primary-container focus:ring-2 focus:ring-primary-container/10'
              }`}
              {...register('salePrice')}
            />
            {errors.salePrice && (
              <p className="text-xs text-[#e53935] font-medium">{getErrorMessage(errors.salePrice.message)}</p>
            )}
          </div>

          {/* Initial Stock */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="stock" className="text-sm font-medium text-on-surface-variant">
              {t('inventory.modal.stock')}
            </label>
            <input
              id="stock"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              className={`w-full bg-surface-container-lowest border rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-on-surface-variant/30 ${
                errors.stock
                  ? 'border-[#e53935] focus:border-[#e53935] focus:ring-2 focus:ring-[#e53935]/10'
                  : 'border-outline-variant/15 focus:border-primary-container focus:ring-2 focus:ring-primary-container/10'
              }`}
              {...register('stock')}
            />
            {errors.stock && (
              <p className="text-xs text-[#e53935] font-medium">{getErrorMessage(errors.stock.message)}</p>
            )}
          </div>
        </div>

        {/* Estimated Profit Margin */}
        <div className="flex items-center gap-3 pt-2">
          <div className="p-1.5 rounded-lg bg-secondary-container/20">
            <Icon icon={TrendingUp} size={16} className="text-secondary-container" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.15em] text-on-surface-variant/50 uppercase">
              {t('inventory.modal.profit_margin')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-display font-bold text-secondary-container">
                {profitMargin ? `${profitMargin.percent}%` : t('inventory.modal.profit_margin_na')}
              </span>
              {profitMargin && (
                <span className="text-xs text-on-surface-variant/60">
                  (${profitMargin.amount} {t('inventory.modal.per_unit')})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          {t('inventory.modal.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className={isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('inventory.modal.saving')}
            </span>
          ) : (
            t('inventory.modal.save')
          )}
        </Button>
      </div>
    </form>
  );
};
