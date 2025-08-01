import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Key, Star, Package, Shield, CreditCard } from 'lucide-react';

export function ActivationKeysPage() {
  const keyTypes = [
    { name: 'Steam Keys', price: '$5-$60', description: 'مفاتيح تفعيل أصلية لألعاب Steam' },
    { name: 'Origin Keys', price: '$10-$70', description: 'مفاتيح ألعاب EA وOrigin' },
    { name: 'Uplay Keys', price: '$8-$65', description: 'مفاتيح ألعاب Ubisoft' },
    { name: 'Battle.net Keys', price: '$15-$80', description: 'مفاتيح ألعاب Blizzard' }
  ];

  const features = [
    { icon: Shield, title: 'ضمان أصلي', desc: 'جميع المفاتيح أصلية 100%' },
    { icon: Package, title: 'تسليم فوري', desc: 'تسليم المفاتيح خلال دقائق' },
    { icon: Star, title: 'دعم فني', desc: 'دعم عملاء على مدار الساعة' }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
        <ArrowRight className="h-4 w-4 ml-1" /> العودة للرئيسية
      </Link>

      <div className="bg-gradient-to-r from-blue-600 to-purple-800 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-blue-500 rounded-xl flex items-center justify-center">
            <Key className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Activation Keys</h1>
            <p className="text-blue-100 text-lg">مفاتيح تفعيل أصلية لجميع المنصات</p>
            <div className="flex items-center gap-4 mt-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">349,870 عنصر</span>
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold">4.9</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">نظرة عامة</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                مفاتيح التفعيل (Activation Keys) هي رموز رقمية تُستخدم لتفعيل وتنزيل الألعاب والبرامج
                من المنصات الرقمية المختلفة. نحن نقدم مفاتيح أصلية 100% لجميع المنصات الرئيسية.
              </p>
              <p className="text-gray-700 leading-relaxed">
                جميع مفاتيحنا مضمونة وتأتي مع دعم فني كامل. نحن نعمل مع موردين معتمدين فقط
                لضمان جودة وأصالة جميع المنتجات.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">أنواع المفاتيح المتاحة</h2>
              <div className="space-y-4">
                {keyTypes.map((keyType, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Key className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{keyType.name}</h3>
                        <p className="text-sm text-gray-600">{keyType.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{keyType.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">المميزات</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات سريعة</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">إجمالي المفاتيح</span>
                  <span className="font-medium">349,870</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">المنصات المدعومة</span>
                  <span className="font-medium">15+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">معدل الرضا</span>
                  <span className="font-medium">98.5%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">تصفح المفاتيح</h3>
              <div className="space-y-3">
                <button className="w-full btn-primary flex items-center justify-center gap-2">
                  <Key className="h-4 w-4" /> تصفح المفاتيح
                </button>
                <button className="w-full btn-outline flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4" /> الأسعار المميزة
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">المنصات الشائعة</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Steam</span>
                  <span className="text-sm text-gray-500">25,000+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Epic Games</span>
                  <span className="text-sm text-gray-500">12,000+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Origin</span>
                  <span className="text-sm text-gray-500">8,500+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Uplay</span>
                  <span className="text-sm text-gray-500">6,200+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
