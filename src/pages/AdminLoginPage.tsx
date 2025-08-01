import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export function AdminLoginPage() {
  const { user, loading, signIn } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // إعادة توجيه المستخدم المسجل
  if (!loading && user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const { error: signInError } = await signIn(formData.email, formData.password);
      
      if (signInError) {
        setError('بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" />
        <p className="text-center text-gray-600 mt-4">جاري التحقق من حالة الدخول...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            تسجيل دخول المدير
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            أدخل بيانات الدخول للوصول إلى لوحة التحكم
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <ErrorMessage message={error} />}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field pr-10"
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="input-field pr-10"
                  placeholder="أدخل كلمة المرور"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" className="ml-2" />
                جاري تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}