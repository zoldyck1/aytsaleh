import React from 'react';
import { Search, Calendar, Filter, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export interface SearchFilters {
  query: string;
  dateFrom: string;
  dateTo: string;
  sortBy: 'newest' | 'oldest' | 'title';
  category?: string;
}

interface PostSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  totalResults: number;
  isLoading?: boolean;
}

export function PostSearch({ 
  filters, 
  onFiltersChange, 
  totalResults, 
  isLoading = false 
}: PostSearchProps) {
  const { t } = useTranslation();
  const handleQueryChange = (query: string) => {
    onFiltersChange({ ...filters, query });
  };

  const handleDateFromChange = (dateFrom: string) => {
    onFiltersChange({ ...filters, dateFrom });
  };

  const handleDateToChange = (dateTo: string) => {
    onFiltersChange({ ...filters, dateTo });
  };

  const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const clearFilters = () => {
    onFiltersChange({
      query: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'newest'
    });
  };

  const hasActiveFilters = filters.query || filters.dateFrom || filters.dateTo || filters.sortBy !== 'newest';

  return (
    <div className="card mb-6 animate-fade-in">
      <div className="card-body">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={filters.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="input-field pr-10"
              placeholder={t('searchPosts', 'ابحث في المنشورات...')}
              aria-label={t('searchPosts', 'البحث في المنشورات')}
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Date Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                <span>{t('filterByDate', 'تصفية بالتاريخ:')}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex flex-col">
                  <label htmlFor="dateFrom" className="sr-only">{t('fromDate', 'من تاريخ')}</label>
                  <input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="input-field text-sm"
                    aria-label={t('fromDate', 'من تاريخ')}
                  />
                </div>
                
                <div className="flex items-center justify-center">
                  <span className="text-gray-400 text-sm">{t('to', 'إلى')}</span>
                </div>
                
                <div className="flex flex-col">
                  <label htmlFor="dateTo" className="sr-only">{t('toDate', 'إلى تاريخ')}</label>
                  <input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="input-field text-sm"
                    aria-label={t('toDate', 'إلى تاريخ')}
                  />
                </div>
              </div>
            </div>

            {/* Sort and Clear */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SearchFilters['sortBy'])}
                  className="input-field text-sm min-w-[120px]"
                  aria-label={t('sortResults', 'ترتيب النتائج')}
                >
                  <option value="newest">{t('newestFirst', 'الأحدث أولاً')}</option>
                  <option value="oldest">{t('oldestFirst', 'الأقدم أولاً')}</option>
                  <option value="title">{t('alphabetical', 'ترتيب أبجدي')}</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn-secondary btn-sm flex items-center gap-1"
                  aria-label={t('clearFilters', 'مسح الفلاتر')}
                >
                  <X className="h-3 w-3" />
                  {t('clear', 'مسح')}
                </button>
              )}
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="loading-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                  <span>{t('searching', 'جاري البحث...')}</span>
                </div>
              ) : (
                <span>
                  {totalResults === 0 
                    ? t('noResults', 'لم يتم العثور على نتائج') 
                    : `${t('foundResults', 'تم العثور على')} ${totalResults} ${totalResults === 1 ? t('post', 'منشور') : t('posts', 'منشور')}`
                  }
                  {filters.query && (
                    <span className="font-medium"> {t('forSearch', 'للبحث')} "{filters.query}"</span>
                  )}
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>{t('activeFilters', 'فلاتر نشطة')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
