import React, { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../lib/translations';

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, setLanguage, isRTL } = useLanguage();

  useEffect(() => {
    // Add/remove RTL class to body for additional styling
    if (isRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [isRTL]);

  const changeLanguage = (language: Language) => {
    setLanguage(language);
  };

  const languages = [
    { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' },
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  ];

  return (
    <div className="language-switcher">
      <div className="flex gap-2 flex-wrap">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`
              px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2
              ${
                currentLanguage === lang.code
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }
            `}
            title={`Switch to ${lang.name}`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
