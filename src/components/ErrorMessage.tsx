import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div className={`flex items-center space-x-2 space-x-reverse text-red-600 bg-red-50 p-4 rounded-lg ${className}`}>
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm">{message}</span>
    </div>
  );
}