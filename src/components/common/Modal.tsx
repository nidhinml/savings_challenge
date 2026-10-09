import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm?: () => void;
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmText,
  confirmVariant = 'primary',
  onConfirm,
  isLoading = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {confirmVariant === 'danger' && (
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              {description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {children && <div className="mb-6">{children}</div>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          {confirmText && onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                confirmVariant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/20'
              }`}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
