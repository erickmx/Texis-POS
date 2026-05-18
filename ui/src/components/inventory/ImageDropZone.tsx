'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Icon } from '../ui/Icon';
import { useTranslation } from '@/i18n/client';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface ImageDropZoneProps {
  value?: File | string | null;
  onChange: (file: File | null) => void;
  error?: string;
  lng: string;
}

export const ImageDropZone: React.FC<ImageDropZoneProps> = ({
  value,
  onChange,
  error,
  lng,
}) => {
  const { t } = useTranslation(lng, 'common');
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: 'product-image-drop',
    data: { type: 'image' },
  });

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return t('inventory.modal.errors.image_type');
    }
    if (file.size > MAX_SIZE_BYTES) {
      return t('inventory.modal.errors.image_size');
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setLocalError(validationError);
        return;
      }
      setLocalError(null);
      onChange(file);
    },
    [onChange, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const handleRemove = useCallback(() => {
    setLocalError(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onChange]);

  const previewUrl = value instanceof File ? URL.createObjectURL(value) : value || null;

  const displayError = error || localError || undefined;

  const isActive = isDragging || isOver;

  return (
    <div className="flex flex-col gap-2">
      {previewUrl ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-outline-variant/15 bg-surface-container-low">
          <img
            src={previewUrl}
            alt={t('inventory.modal.image_preview_alt')}
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-surface-container-lowest/90 hover:bg-surface-container-lowest rounded-full shadow-ambient transition-colors"
            aria-label={t('inventory.modal.image_remove')}
          >
            <Icon icon={X} size={16} className="text-on-surface-variant" />
          </button>
        </div>
      ) : (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label={t('inventory.modal.image')}
          className={`
            relative w-full h-48 rounded-xl border-2 border-dashed transition-all cursor-pointer
            flex flex-col items-center justify-center gap-3
            ${
              isActive
                ? 'border-primary-container bg-primary-fixed/30'
                : 'border-outline-variant/30 hover:border-primary-container/50 hover:bg-surface-container-low/50 bg-surface-container-lowest'
            }
          `}
        >
          <div className="p-3 rounded-full bg-surface-container-low">
            <Icon icon={Upload} size={24} className="text-on-surface-variant/60" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-on-surface-variant">
              {t('inventory.modal.image_drop')}
            </p>
            <p className="text-xs text-on-surface-variant/50 mt-1">
              {t('inventory.modal.image_types')}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {displayError && (
        <p className="text-xs text-[#e53935] font-medium">{displayError}</p>
      )}
    </div>
  );
};
