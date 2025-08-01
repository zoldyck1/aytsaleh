import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" />
        <p className="text-center text-gray-600 mt-4">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  if (!user || !admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}