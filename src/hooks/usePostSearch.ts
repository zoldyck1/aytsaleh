import { useState, useEffect, useMemo } from 'react';
import { Post } from '../lib/supabase';
import { SearchFilters } from '../components/PostSearch';

export function usePostSearch(posts: Post[]) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'newest',
    category: undefined
  });
  
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (filters.query) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [filters.query]);

  const filteredAndSortedPosts = useMemo(() => {
    let filtered = [...posts];

    // Apply text search filter
    if (filters.query.trim()) {
      const searchTerm = filters.query.toLowerCase().trim();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        (post.description && post.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(post => {
        // Handle both Publication and Post types
        const postCategory = (post as any).category || (post as any).category?.slug;
        return postCategory === filters.category;
      });
    }

    // Apply date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(post => {
        const postDate = new Date(post.created_at);
        postDate.setHours(0, 0, 0, 0);
        return postDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(post => {
        const postDate = new Date(post.created_at);
        return postDate <= toDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title, 'ar');
        default:
          return 0;
      }
    });

    return filtered;
  }, [posts, filters]);

  const searchStats = useMemo(() => {
    const total = filteredAndSortedPosts.length;
    const hasActiveFilters = Boolean(
      filters.query || 
      filters.dateFrom || 
      filters.dateTo || 
      filters.sortBy !== 'newest' ||
      (filters.category && filters.category !== 'all')
    );

    return {
      total,
      hasActiveFilters,
      isFiltered: hasActiveFilters
    };
  }, [filteredAndSortedPosts.length, filters]);

  const resetFilters = () => {
    setFilters({
      query: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'newest',
      category: undefined
    });
  };

  // URL parameter sync (optional)
  const updateFiltersFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const newFilters: SearchFilters = {
      query: urlParams.get('q') || '',
      dateFrom: urlParams.get('from') || '',
      dateTo: urlParams.get('to') || '',
      sortBy: (urlParams.get('sort') as SearchFilters['sortBy']) || 'newest',
      category: urlParams.get('category') || undefined
    };
    setFilters(newFilters);
  };

  const updateURLFromFilters = () => {
    const urlParams = new URLSearchParams();
    
    if (filters.query) urlParams.set('q', filters.query);
    if (filters.dateFrom) urlParams.set('from', filters.dateFrom);
    if (filters.dateTo) urlParams.set('to', filters.dateTo);
    if (filters.sortBy !== 'newest') urlParams.set('sort', filters.sortBy);
    if (filters.category && filters.category !== 'all') urlParams.set('category', filters.category);

    const newURL = urlParams.toString() 
      ? `${window.location.pathname}?${urlParams.toString()}`
      : window.location.pathname;
    
    window.history.replaceState({}, '', newURL);
  };

  // Sync with URL on filters change
  useEffect(() => {
    updateURLFromFilters();
  }, [filters]);

  return {
    filters,
    setFilters,
    filteredPosts: filteredAndSortedPosts,
    isSearching,
    searchStats,
    resetFilters,
    updateFiltersFromURL
  };
}
