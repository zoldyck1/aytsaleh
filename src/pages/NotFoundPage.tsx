import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowRight } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="max-w-4xl mx-auto text-center py-20">
      {/* 404 Icon */}
      <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
        <span className="text-6xl font-bold text-gray-400">404</span>
      </div>

      {/* Error Message */}
      <h1 className="text-4xl font-bold text-gray-900 mb-4">الصفحة غير موجودة</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        عذراً، لا يمكن العثور على الصفحة التي تبحث عنها. ربما تم حذفها أو نقلها إلى موقع آخر.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          to="/"
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <Home className="h-5 w-5" />
          العودة للرئيسية
        </Link>
        
        <Link
          to="/"
          className="btn-outline flex items-center gap-2 px-6 py-3"
        >
          <Search className="h-5 w-5" />
          البحث في الموقع
        </Link>
      </div>

      {/* Helpful Links */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">صفحات مفيدة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/platform/steam"
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-blue-600 font-medium">Steam</div>
            <div className="text-sm text-gray-600">منصة الألعاب</div>
          </Link>
          
          <Link
            to="/platform/playstation"
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-blue-600 font-medium">PlayStation</div>
            <div className="text-sm text-gray-600">ألعاب الكونسول</div>
          </Link>
          
          <Link
            to="/platform/xbox-game-pass"
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-green-600 font-medium">Xbox Game Pass</div>
            <div className="text-sm text-gray-600">اشتراك الألعاب</div>
          </Link>
          
          <Link
            to="/category/activation-keys"
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
          >
            <div className="text-purple-600 font-medium">مفاتيح التفعيل</div>
            <div className="text-sm text-gray-600">جميع المنصات</div>
          </Link>
        </div>
      </div>

      {/* Additional Help */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h4 className="text-lg font-medium text-blue-900 mb-2">هل تحتاج مساعدة؟</h4>
        <p className="text-blue-700 mb-4">
          إذا كنت تعتقد أن هذا خطأ، أو كنت تبحث عن شيء محدد، يمكنك العودة للصفحة الرئيسية واستخدام البحث.
        </p>
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
