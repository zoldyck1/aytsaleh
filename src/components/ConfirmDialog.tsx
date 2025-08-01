import React from 'react';
import { AlertTriangle, Trash2, Check, X } from 'lucide-react';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'danger',
  loading = false
}: ConfirmDialogProps) {
  const { t } = useLanguage();
  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const iconColors = {
    danger: 'text-error-600',
    warning: 'text-warning-600',
    info: 'text-primary-600'
  };

  const buttonColors = {
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-primary'
  };
  
  const bgColors = {
    danger: 'bg-error-100',
    warning: 'bg-warning-100',
    info: 'bg-primary-100'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title=""
      size="sm"
      preventClose={loading}
    >
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${bgColors[type]} mb-4`}>
          {type === 'danger' ? (
            <Trash2 className={`h-6 w-6 ${iconColors[type]}`} />
          ) : (
            <AlertTriangle className={`h-6 w-6 ${iconColors[type]}`} />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-6">
          {message}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 min-w-[100px]"
          >
            <X className="h-4 w-4" />
            {cancelText || t('cancel')}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`btn ${buttonColors[type]} flex items-center gap-2 min-w-[100px] text-white`}
          >
            {loading ? (
              <div className="loading-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {confirmText || t('confirm')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
