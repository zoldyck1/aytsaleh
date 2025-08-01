import React from 'react';
import { useTranslation } from 'react-i18next';

const ExampleComponent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {t('welcome')}
        </h1>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {t('navigation.home')}
            </h2>
            <p className="text-gray-600">
              {t('language')}: <span className="font-medium">{t('language')}</span>
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {t('news.title')}
            </h2>
            <p className="text-gray-600 mb-2">
              Example of nested translation: {t('news.publishedOn')} 01/08/2025
            </p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
              {t('news.readMore')}
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Common Buttons
            </h2>
            <div className="flex gap-2 flex-wrap">
              <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors">
                {t('buttons.save')}
              </button>
              <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors">
                {t('buttons.edit')}
              </button>
              <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors">
                {t('buttons.delete')}
              </button>
              <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors">
                {t('buttons.cancel')}
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Navigation Examples
            </h2>
            <nav className="flex gap-4">
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-colors">
                {t('navigation.home')}
              </a>
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-colors">
                {t('navigation.about')}
              </a>
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-colors">
                {t('navigation.news')}
              </a>
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-colors">
                {t('navigation.contact')}
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleComponent;
