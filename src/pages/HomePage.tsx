import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Heart, Plus, Image as ImageIcon, FileText, ArrowRight, MessageCircle, Filter, TrendingUp, Star, BookOpen, Sparkles } from 'lucide-react';
import { Post, Category, Publication } from '../lib/supabase';
import { PostService } from '../services/postService';
import { CategoryService } from '../services/categoryService';
import { PublicationService } from '../services/publicationService';
import { CommentService } from '../services/commentService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { usePostSearch } from '../hooks/usePostSearch';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export function HomePage() {
  const { t, currentLanguage } = useLanguage();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [commentCounts, setCommentCounts] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [visiblePosts, setVisiblePosts] = useState(6);
  
  // Search and filtering - now using publications directly
  const {
    filters,
    setFilters,
    filteredPosts,
    isSearching,
    searchStats,
    updateFiltersFromURL
  } = usePostSearch(publications);

  useEffect(() => {
    Promise.all([loadData(), loadCategories()]);
    updateFiltersFromURL();
  }, []);
  
  useEffect(() => {
    // Update document title based on search
    if (searchStats.isFiltered) {
      document.title = `${t('search')}: ${filters.query || t('filteredPosts')} - ${t('newsplatform')}`;
    } else {
      document.title = `${t('newsplatform')} - ${t('latestNewsAndPosts')}`;
    }
    
    return () => {
      document.title = `${t('newsplatform')} - ${t('latestNewsAndPosts')}`;
    };
  }, [filters, searchStats.isFiltered, t]);

  const loadData = async () => {
    const timeoutId = setTimeout(() => {
      console.warn('Request timeout - setting loading to false');
      setLoading(false);
      setError('انتهت مهلة تحميل البيانات');
      setPublications([]);
    }, 10000); // 10 second timeout

    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting to fetch publications...');
      
      // Load only publications
      const publicationsData = await PublicationService.getAllPublications();
      
      clearTimeout(timeoutId);
      
      console.log('Publications fetched:', publicationsData.length);
      
      // Filter publications for main page display and sort by date
      const mainPagePublications = publicationsData
        .filter(pub => pub.is_published_on_main)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map(pub => ({
          ...pub,
          description: pub.content,
          isPublication: true,
          images: pub.main_image_url ? [{
            id: `pub-img-main-${pub.id}`,
            url: pub.main_image_url,
            alt_text: pub.title,
            caption: null,
            display_order: 0,
            created_at: pub.created_at,
            post_id: pub.id,
            file_name: 'main-image'
          }] : []
        }));
      
      setPublications(mainPagePublications as any);
      
      // Load comment counts for each publication
      await loadCommentCounts(mainPagePublications);
      
    } catch (err) {
      console.error('Error loading data:', err);
      clearTimeout(timeoutId);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setPublications([]);
    } finally {
      setLoading(false);
    }
  };
  
  const loadCategories = async () => {
    try {
      const data = await CategoryService.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadCommentCounts = async (pubs: Publication[]) => {
    try {
      const counts: {[key: string]: number} = {};
      
      // Load comment counts for each publication
      await Promise.all(
        pubs.map(async (pub) => {
          try {
            const postId = `pub-${pub.id}`;
            const comments = await CommentService.getCommentsByPostId(postId);
            counts[postId] = comments.length;
          } catch (err) {
            console.error(`Error loading comments for ${pub.id}:`, err);
            counts[`pub-${pub.id}`] = 0;
          }
        })
      );
      
      setCommentCounts(counts);
    } catch (err) {
      console.error('Error loading comment counts:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string | null | undefined, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const translatedCategories = [{
    id: 'all',
    slug: 'all',
    label: 'جميع الفئات',
    icon: TrendingUp
  }, ...categories.map(category => ({
    id: category.id,
    slug: category.slug,
    label: category.name_ar,
    icon: Star // fallback icon
  }))];

  const handleCategoryChange = (categorySlug: string) => {
    setActiveCategory(categorySlug);
    // Filter publications by category
    if (categorySlug === 'all') {
      // Show all publications
      setFilters({
        ...filters,
        category: undefined
      });
    } else {
      // Filter by specific category
      setFilters({
        ...filters,
        category: categorySlug
      });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      query: e.target.value
    });
  };

  const loadMorePosts = () => {
    setVisiblePosts(prev => prev + 6);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <p className="text-emerald-600 font-medium">جاري تحميل المزيد...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">حدث خطأ في التحميل</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container-mobile py-4 sm:py-8">
        {/* Hero Section - Green Theme */}
        <section className="relative mb-16 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-green-700 via-green-600 to-green-800"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-900 via-transparent to-green-900 opacity-20"></div>
          <div className="relative z-10 py-16 px-8 lg:px-12">
            <div className="max-w-5xl mx-auto text-right">
              {/* Welcome Title */}
              <div className="mb-12">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight font-arabic drop-shadow-lg">
                  {t('hero.welcomeTitle')}
                </h1>
              </div>

              {/* Main Description */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/20">
                <p className="text-lg md:text-xl text-white/95 leading-relaxed mb-6 font-arabic">
                  {t('hero.description1')}
                </p>
                <p className="text-lg md:text-xl text-white/95 leading-relaxed font-arabic">
                  {t('hero.description2')}
                </p>
              </div>

              {/* What you can do section */}
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
                  {t('hero.whatYouCanDo')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <div className="bg-teal-500 rounded-full p-3 flex-shrink-0">
                      <span className="text-2xl">📢</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{t('hero.features.news.title')}</h3>
                      <p className="text-white/90">{t('hero.features.news.description')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <div className="bg-blue-600 rounded-full p-3 flex-shrink-0">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{t('hero.features.announcements.title')}</h3>
                      <p className="text-white/90">{t('hero.features.announcements.description')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <div className="bg-cyan-500 rounded-full p-3 flex-shrink-0">
                      <span className="text-2xl">💬</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{t('hero.features.interaction.title')}</h3>
                      <p className="text-white/90">{t('hero.features.interaction.description')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <div className="bg-blue-500 rounded-full p-3 flex-shrink-0">
                      <span className="text-2xl">📧</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{t('hero.features.contact.title')}</h3>
                      <p className="text-white/90">{t('hero.features.contact.description')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </section>

        {/* Filter Section */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex flex-col gap-6">
                {/* Language Switcher and Category Filters Row */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Category Filters */}
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">{t('filterByCategory')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {translatedCategories.map((category) => {
                      const isActive = activeCategory === category.slug;
                      return (
                        <button
                          key={category.slug}
                          onClick={() => handleCategoryChange(category.slug)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                          }`}
                        >
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                  {/* Language Switcher */}
                  <div className="flex-shrink-0">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">{t('selectLanguage')}</h3>
                    <LanguageSwitcher />
                  </div>
                </div>

                {/* Search Box Row */}
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder={t('searchInPosts')}
                        value={filters.query}
                        onChange={handleSearchChange}
                        className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 text-right placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Posts Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              آخر المنشورات
            </h2>
            <div className="w-20 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </div>
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد منشورات حالياً
              </h3>
              <p className="text-gray-600">
                سيتم نشر المحتوى قريباً
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.slice(0, visiblePosts).map((post, index) => (
                <article key={post.id} className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                  <Link to={`/${(post as any).isPublication ? 'post/pub-' + post.id : 'post/' + post.id}`}>
                    <div className="relative h-48 bg-gray-100">
                      {post.images && post.images.length > 0 ? (
                        <>
                          <img
                            src={post.images[0].url}
                            alt={post.images[0].alt_text || post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              console.log('Image failed to load:', post.images[0].url);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          {/* Image Count Badge */}
                          {post.images.length > 1 && (
                            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-md text-sm font-medium flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              <span>{post.images.length}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {(post as any).isPublication ? (
                            <div className="text-center">
                              <BookOpen className="w-12 h-12 text-primary-400 mx-auto mb-2" />
                              <p className="text-primary-600 font-medium text-sm">منشور موقع</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 font-medium text-sm">منشور مجتمعي</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Publication Badge */}
                      {(post as any).isPublication && (
                        <div className="absolute top-3 left-3">
                          <div className="bg-primary-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>موقع</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  {/* Content */}
                  <div className="p-6">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <Clock className="w-4 h-4" />
                      <time dateTime={post.created_at}>
                        {formatDate(post.created_at)}
                      </time>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
                      {post.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                      {truncateText(post.description, 120)}
                    </p>
                    
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Link
                      to={`/${(post as any).isPublication ? 'post/pub-' + post.id : 'post/' + post.id}`}
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors duration-200"
                    >
                        <span>اقرأ المزيد</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{commentCounts[`pub-${post.id}`] || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          
          {/* Load More Button */}
          {filteredPosts.length > visiblePosts && (
            <div className="text-center mt-12">
              <button
                onClick={loadMorePosts}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-full font-bold hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span>تحميل المزيد</span>
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
