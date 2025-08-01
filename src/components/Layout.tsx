import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Newspaper, Home, Shield, LogOut, User, Settings, Languages, Menu, X, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ExternalLink, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { NavbarSearch } from './NavbarSearch';
import { usePostSearch } from '../hooks/usePostSearch';
import { useBodyClass } from '../hooks/useBodyClass';
import { PostService } from '../services/postService';
import { Post } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use body class hook to manage route-based styling
  useBodyClass();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Check if we're on a post detail page
  const isPostDetailPage = location.pathname.startsWith('/post/');
  const isHomePage = location.pathname === '/';

  // Global search state
  const {
    filters,
    setFilters,
    searchStats
  } = usePostSearch(posts);

  // Load posts for search
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await PostService.getAllPosts();
        setPosts(data);
      } catch (error) {
        console.error('Error loading posts for search:', error);
      }
    };

    loadPosts();
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Force page reload to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* الهيدر - Modern Design */}
      <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-300 sticky top-0 z-50">
        <div className="flex justify-between items-center h-20 px-4">
          {/* الشعار - Clean Logo with Text */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <img
              src="https://res.cloudinary.com/dalpnjdav/image/upload/v1754081448/5794158569229240997_cgugli.jpg"
              alt="جمعية آفاق لتدبير مرفق الماء الصالح للشرب"
              className="h-12 w-auto object-contain bg-transparent sm:h-20"
              style={{
                mixBlendMode: 'darken',
                backgroundColor: 'transparent',
                background: 'transparent',
                boxShadow: 'none',
                border: 'none'
              }}
              onError={(e) => {
                console.error('Logo failed to load');
                // Fallback to text if image fails
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'text-lg font-bold text-gray-900';
                fallback.textContent = 'جمعية آفاق';
                e.currentTarget.parentNode?.appendChild(fallback);
              }}
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-sm sm:text-base lg:text-lg font-bold text-green-600 leading-tight">
                جمعية آفاق لتدبير مرفق الماء الصالح للشرب بآيت صالح
              </span>
              <span className="text-xs sm:text-sm text-blue-600 font-medium mt-1">
                Association Afak pour la gestion du service d'eau potable à Aït Saleh
              </span>
            </div>
          </div>

          {/* القائمة */}
          <div className="flex items-center gap-4">
            <nav className="flex items-center space-x-3 space-x-reverse">
              <Link
                to="/"
                className={`flex items-center space-x-1 space-x-reverse px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/')
                  ? 'bg-gray-100 text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:block">{t('home')}</span>
              </Link>

              {user ? (
                <>
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-1 space-x-reverse px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/admin')
                      ? 'bg-gray-100 text-black shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:block">{t('dashboard')}</span>
                  </Link>

                  {/* User menu */}
                  <div className="relative group">
                    <button className="flex items-center space-x-1 space-x-reverse px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:block">{t('admin')}</span>
                    </button>

                    {/* Dropdown menu */}
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                          {t('welcome')}, {user.email}
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-2 space-x-reverse px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{t('logout')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  to="/admin/login"
                  className="flex items-center space-x-1 space-x-reverse px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-black transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Shield className="h-4 w-4" />
                  <span>{t('login')}</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* الفوتر */}
      <footer className="bg-gradient-to-r from-gray-700 via-gray-800 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <Link to="/">
                <img
                  src="https://res.cloudinary.com/dalpnjdav/image/upload/v1754079021/5794158569229240997_auxcmy.jpg"
                  alt="جمعية آفاق لتدبير مرفق الماء الصالح للشرب"
                  className="h-12 w-auto object-contain"
                  style={{
                    mixBlendMode: 'screen',
                    opacity: 0.8
                  }}
                />
              </Link>
              <p className="mt-4 text-gray-400">
                جمعية آفاق لتدبير مرفق الماء الصالح للشرب بآيت صالح - منظمة تعمل على توفير خدمات الماء الصالح للشرب للمجتمع.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">الرئيسية</Link></li>
                <li><Link to="/category/articles" className="text-gray-400 hover:text-white">مقالات</Link></li>
                <li><Link to="/category/reports" className="text-gray-400 hover:text-white">تقارير</Link></li>
                <li><Link to="/category/news" className="text-gray-400 hover:text-white">أخبار</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">الدعم</h3>
              <ul className="space-y-2">
                <li><Link to="/contact" className="text-gray-400 hover:text-white">اتصل بنا</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white">الأسئلة الشائعة</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white">سياسة الخصوصية</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">تابعنا</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-twitter"></i></a>
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-instagram"></i></a>
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8 text-center text-gray-500">
            <p>{t('copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}