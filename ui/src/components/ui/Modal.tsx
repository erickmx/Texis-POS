'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, subtitle, children }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-on-surface/20" />

      {/* Modal Card */}
      <div
        ref={contentRef}
        className="glass relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-ambient border border-outline-variant/15"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10">
          <div className="flex flex-col gap-1">
            <h2
              id="modal-title"
              className="text-xl font-display font-bold text-on-surface tracking-tight"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-on-surface-variant/60">
                {subtitle}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
            aria-label="Close modal"
          >
            <Icon icon={X} size={20} className="text-on-surface-variant" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
};
