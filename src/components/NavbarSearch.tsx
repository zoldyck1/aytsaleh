import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, Filter, TrendingUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchFilters } from './PostSearch';
import { useLanguage } from '../contexts/LanguageContext';

interface NavbarSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  totalResults?: number;
  isSearching?: boolean;
}

export function NavbarSearch({ 
  filters, 
  onFiltersChange, 
  totalResults = 0, 
  isSearching = false 
}: NavbarSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-expand on homepage with active search
  useEffect(() => {
    if (location.pathname === '/' && (filters.query || filters.dateFrom || filters.dateTo)) {
      setIsExpanded(true);
    }
  }, [location.pathname, filters]);

  const handleSearchFocus = () => {
    setIsExpanded(true);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleQueryChange = (query: string) => {
    onFiltersChange({ ...filters, query });
  };

  const handleClearSearch = () => {
    onFiltersChange({
      query: '',
      dateFrom: '',
      dateTo: '',  
      sortBy: 'newest'
    });
    setIsExpanded(false);
    setShowFilters(false);
  };

  const hasActiveFilters = filters.query || filters.dateFrom || filters.dateTo || filters.sortBy !== 'newest';

  return (
    <div ref={searchRef} className="relative">
      {/* Search Input */}
      <div className={`
        flex items-center transition-all duration-300 ease-out
        ${isExpanded 
          ? 'w-80 md:w-96 bg-white shadow-lg rounded-lg border border-gray-200' 
          : 'w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer'
        }
      `}>
        {!isExpanded ? (
          <button
            onClick={handleSearchFocus}
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
            aria-label={t('openSearch')}
          >
            <Search className="h-5 w-5 text-gray-600" />
          </button>
        ) : (
          <>
            <div className="flex items-center flex-1 px-4 py-3">
              <Search className="h-5 w-5 text-gray-400 ml-3" />
              <input
                ref={inputRef}
                type="text"
                value={filters.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 text-sm"
                placeholder={t('searchInPosts')}
                autoFocus
              />
              
              {/* Loading indicator */}
              {isSearching && (
                <div className="loading-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full ml-2" />
              )}
              
              {/* Clear button */}
              {filters.query && (
                <button
                  onClick={() => handleQueryChange('')}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label={t('clearSearch')}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                px-3 py-3 border-r border-gray-200 transition-colors
                ${hasActiveFilters ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-gray-600'}
              `}
              aria-label={t('searchFilters')}
            >
              <Filter className="h-4 w-4" />
            </button>

            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="px-3 py-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={t('closeSearch')}
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Expanded Filters Panel */}
      {isExpanded && showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-slide-up">
          <div className="space-y-4">
            {/* Date Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t('fromDate')}
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t('toDate')}
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {t('sortResults')}
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as SearchFilters['sortBy'] })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="newest">{t('newestFirst')}</option>
                <option value="oldest">{t('oldestFirst')}</option>
                <option value="title">{t('alphabeticalSort')}</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-600">
                {totalResults > 0 && (
                  <span>{totalResults} {t('results')}</span>
                )}
              </div>
              
              {hasActiveFilters && (
                <button
                  onClick={handleClearSearch}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t('clearAllFilters')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Results Preview (when searching) */}
      {isExpanded && filters.query && location.pathname === '/' && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-40 animate-slide-up">
          <div className="p-3">
            <div className="text-xs text-gray-600 mb-2 flex items-center gap-2">
              <Search className="h-3 w-3" />
              {totalResults === 0 ? t('noResultsFound') : `${totalResults} ${t('results')}`}
            </div>
            
            {totalResults > 0 && (
              <div className="text-xs text-primary-600">
                {t('pressEnterForResults')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
