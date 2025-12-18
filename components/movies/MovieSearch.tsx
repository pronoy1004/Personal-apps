'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, Film, Tv } from 'lucide-react';
import { useMovies } from '@/contexts/MoviesContext';
import MediaCard from './MediaCard';
import type { MediaEntry, StreamingProvider } from '@/lib/types';

interface SearchResult {
  id: number;
  tmdbId: number;
  type: 'movie' | 'tv';
  title: string;
  posterPath?: string;
  backdropPath?: string;
  overview: string;
  releaseDate?: string;
  firstAirDate?: string;
  genres: string[];
  rating: number;
  popularity: number;
  posterUrl?: string | null;
  watchProviders?: StreamingProvider[];
}

export default function MovieSearch() {
  const { addMediaEntry, addToWatchlist, addToWatched, getWatchEntryByMediaId } = useMovies();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'movie' | 'tv' | 'both'>('both');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const performSearch = useCallback(async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type,
        page: page.toString(),
      });

      const response = await fetch(`/api/movies/search?${params}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      const newResults: SearchResult[] = data.results.map((item: any) => ({
        id: item.id || item.tmdbId,
        tmdbId: item.id || item.tmdbId,
        type: item.media_type || (item.type || (item.release_date ? 'movie' : 'tv')),
        title: item.title || item.name,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        overview: item.overview || '',
        releaseDate: item.release_date,
        firstAirDate: item.first_air_date,
        genres: item.genres || [],
        rating: item.vote_average || 0,
        popularity: item.popularity || 0,
        posterUrl: item.posterUrl,
        watchProviders: item.watchProviders || [],
      }));

      if (page === 1) {
        setResults(newResults);
      } else {
        setResults((prev) => [...prev, ...newResults]);
      }

      setHasMore(data.totalPages > page);
      setCurrentPage(page);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setHasMore(false);
      setCurrentPage(1);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query, 1);
    }, 500);

    debounceTimerRef.current = timer;
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, type, performSearch]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          performSearch(query, currentPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, query, currentPage, performSearch]);

  const handleAddToWatchlist = (result: SearchResult) => {
    const mediaEntry = addMediaEntry({
      tmdbId: result.tmdbId,
      type: result.type,
      title: result.title,
      posterPath: result.posterPath,
      backdropPath: result.backdropPath,
      overview: result.overview,
      releaseDate: result.releaseDate,
      firstAirDate: result.firstAirDate,
      genres: result.genres,
      rating: result.rating,
      popularity: result.popularity,
    });
    addToWatchlist(mediaEntry.id);
  };

  const handleAddToWatched = (result: SearchResult) => {
    const mediaEntry = addMediaEntry({
      tmdbId: result.tmdbId,
      type: result.type,
      title: result.title,
      posterPath: result.posterPath,
      backdropPath: result.backdropPath,
      overview: result.overview,
      releaseDate: result.releaseDate,
      firstAirDate: result.firstAirDate,
      genres: result.genres,
      rating: result.rating,
      popularity: result.popularity,
    });
    addToWatched(mediaEntry.id);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies and TV shows..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'movie' | 'tv' | 'both')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="both">All</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading && results.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((result) => {
            // Check if this media already exists in our collection
            const existingMedia = data?.mediaEntries.find(
              (m) => m.tmdbId === result.tmdbId && m.type === result.type
            );
            const watchEntry = existingMedia ? getWatchEntryByMediaId(existingMedia.id) : null;

            return (
              <MediaCard
                key={`${result.type}-${result.tmdbId}`}
                media={{
                  tmdbId: result.tmdbId,
                  type: result.type,
                  title: result.title,
                  posterPath: result.posterPath,
                  backdropPath: result.backdropPath,
                  overview: result.overview,
                  releaseDate: result.releaseDate,
                  firstAirDate: result.firstAirDate,
                  genres: result.genres,
                  rating: result.rating,
                  popularity: result.popularity,
                  addedAt: existingMedia?.addedAt || new Date().toISOString(),
                  id: existingMedia?.id || '',
                  posterUrl: result.posterUrl,
                  watchProviders: result.watchProviders,
                }}
                currentStatus={watchEntry?.status || null}
                currentRating={watchEntry?.rating || null}
                onAddToWatchlist={() => handleAddToWatchlist(result)}
                onAddToWatched={() => handleAddToWatched(result)}
              />
            );
          })}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No results found. Try a different search term.</p>
        </div>
      )}

      {loading && results.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      <div ref={observerTarget} />
    </div>
  );
}

