import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onRemove: (id: string) => void;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export function Toast({ id, type, title, message, duration = 5000, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show toast with animation
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto remove toast
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(removeTimer);
    };
  }, [id, duration, onRemove]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(id), 300);
  };

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const Icon = icons[type];

  const colorClasses = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-error-50 border-error-200 text-error-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800'
  };

  const iconColorClasses = {
    success: 'text-success-500',
    error: 'text-error-500',
    warning: 'text-warning-500',
    info: 'text-primary-500'
  };

  return (
    <div
      className={`
        max-w-sm w-full shadow-lg rounded-lg border p-4 transition-all duration-300 transform
        ${colorClasses[type]}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColorClasses[type]}`} />
        </div>
        <div className="mr-3 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {message && (
            <p className="mt-1 text-sm opacity-90">{message}</p>
          )}
        </div>
        <div className="flex-shrink-0 mr-auto">
          <button
            onClick={handleClose}
            className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-75"
            aria-label="إغلاق التنبيه"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Toast Container Component
export function ToastContainer({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-4 left-4 z-50 space-y-2" dir="ltr">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
}

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast
  };
}
