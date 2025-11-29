'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchFoodClient } from '@/lib/api/food';
import type { FoodSearchResult } from '@/lib/api/food';
import { Search, Loader2, AlertCircle } from 'lucide-react';

interface FoodSearchProps {
  onSelect: (food: FoodSearchResult) => void;
  onClose: () => void;
}

const INITIAL_PAGE_SIZE = 20;
const LOAD_MORE_PAGE_SIZE = 20;

export default function FoodSearch({ onSelect, onClose }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const performSearch = useCallback(async (searchQuery: string, page: number = 1, append: boolean = false) => {
    try {
      const foodResults = await searchFoodClient(searchQuery, { page, pageSize: page === 1 ? INITIAL_PAGE_SIZE : LOAD_MORE_PAGE_SIZE });
      
      if (append) {
        setResults((prev) => [...prev, ...foodResults]);
      } else {
        setResults(foodResults);
      }
      
      setHasMore(foodResults.length >= (page === 1 ? INITIAL_PAGE_SIZE : LOAD_MORE_PAGE_SIZE));
      setCurrentPage(page);
      
      if (!append && foodResults.length === 0) {
        setError('No results found. Try a different search term.');
      } else {
        setError(null);
      }
    } catch (err) {
      if (!append) {
        setError('Failed to search for food. Please try again.');
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      setHasMore(false);
      setCurrentPage(1);
      return;
    }

    setLoading(true);
    setError(null);
    setHasMore(false);
    setCurrentPage(1);

    const timer = setTimeout(() => {
      performSearch(query, 1, false);
    }, 500);

    debounceTimerRef.current = timer;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || query.trim().length < 2) return;
    
    setLoadingMore(true);
    performSearch(query, currentPage + 1, true);
  }, [query, currentPage, hasMore, loadingMore, performSearch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, loadMore]);

  const handleSelect = (food: FoodSearchResult) => {
    onSelect(food);
    setQuery('');
    setResults([]);
    onClose();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for food (e.g., 'chicken breast', 'apple', 'rice')"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </div>

      {(loading || results.length > 0 || error) && (
        <div 
          ref={scrollContainerRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="animate-spin text-blue-500" size={24} />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-2 p-4 text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="py-2">
              {results.map((food, index) => (
                <button
                  key={`${food.name}-${index}`}
                  onClick={() => handleSelect(food)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{food.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {food.calories} cal • {food.protein}g protein • {food.carbs}g carbs • {food.fat}g fat
                    {food.servingSize && ` (per ${food.servingSize})`}
                    {food.source && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-500">• {food.source}</span>
                    )}
                  </div>
                </button>
              ))}
              
              {loadingMore && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="animate-spin text-blue-500" size={20} />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading more...</span>
                </div>
              )}
              
              <div ref={observerTarget} className="h-4" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

