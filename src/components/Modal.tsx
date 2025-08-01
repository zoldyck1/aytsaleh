import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  preventClose?: boolean;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  preventClose = false 
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose();
    }
  };

  return (
    <div 
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className={`modal-content ${sizeClasses[size]}`}
        tabIndex={-1}
      >
        <div className="card-header flex items-center justify-between">
          <h2 id="modal-title" className="text-heading-3">
            {title}
          </h2>
          {!preventClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
              aria-label="إغلاق النافذة"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="card-body">
          {children}
        </div>
      </div>
    </div>
  );
}
