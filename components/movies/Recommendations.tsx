'use client';

import { useState, useCallback } from 'react';
import { useMovies } from '@/contexts/MoviesContext';
import MediaCard from './MediaCard';
import { Sparkles, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import type { MediaEntry, StreamingProvider } from '@/lib/types';
import { refinePreferences } from '@/lib/utils/recommendations';

interface Recommendation {
  media: MediaEntry & { posterUrl?: string | null; watchProviders?: StreamingProvider[] };
  score: number;
  reasons: string[];
}

export default function Recommendations() {
  const { data, loading, addMediaEntry, addToWatchlist, addToWatched, getWatchEntryByMediaId, rateItem } = useMovies();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateRecommendations = useCallback(async () => {
    if (!data) return;

    setLoadingRecs(true);
    setError(null);

    try {
      const response = await fetch('/api/movies/recommendations?limit=20');
      if (!response.ok) throw new Error('Failed to generate recommendations');

      const result = await response.json();
      setRecommendations(result.recommendations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendations');
      console.error('Recommendations error:', err);
    } finally {
      setLoadingRecs(false);
    }
  }, [data]);

  const handleAddToWatchlist = (media: MediaEntry) => {
    const mediaEntry = addMediaEntry({
      tmdbId: media.tmdbId,
      type: media.type,
      title: media.title,
      posterPath: media.posterPath,
      backdropPath: media.backdropPath,
      overview: media.overview,
      releaseDate: media.releaseDate,
      firstAirDate: media.firstAirDate,
      genres: media.genres,
      rating: media.rating,
      popularity: media.popularity,
    });
    addToWatchlist(mediaEntry.id);
  };

  const handleAddToWatched = (media: MediaEntry) => {
    const mediaEntry = addMediaEntry({
      tmdbId: media.tmdbId,
      type: media.type,
      title: media.title,
      posterPath: media.posterPath,
      backdropPath: media.backdropPath,
      overview: media.overview,
      releaseDate: media.releaseDate,
      firstAirDate: media.firstAirDate,
      genres: media.genres,
      rating: media.rating,
      popularity: media.popularity,
    });
    addToWatched(mediaEntry.id);
  };

  const handleRate = (watchEntryId: string, rating: 'thumbs_up' | 'thumbs_down' | null) => {
    rateItem(watchEntryId, rating);
    // Regenerate recommendations after rating to refine preferences
    setTimeout(() => {
      handleGenerateRecommendations();
    }, 500);
  };

  if (!data) return null;

  const watchedWithRatings = data.watchEntries
    .filter((e) => e.status === 'watched' && e.rating)
    .length;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Personalized Recommendations
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on your watched items and ratings
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateRecommendations}
            disabled={loadingRecs || watchedWithRatings === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingRecs ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Get Recommendations
              </>
            )}
          </button>
        </div>

        {watchedWithRatings === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Rate some of your watched items with thumbs up/down to get personalized recommendations.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recommendations ({recommendations.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendations.map((rec) => {
              // Find existing media entry by tmdbId
              const existingMedia = data?.mediaEntries.find(
                (m) => m.tmdbId === rec.media.tmdbId && m.type === rec.media.type
              );
              const watchEntry = existingMedia ? getWatchEntryByMediaId(existingMedia.id) : null;
              const watchEntryId = watchEntry?.id;

              return (
                <div key={rec.media.tmdbId} className="relative">
                  <MediaCard
                    media={rec.media}
                    currentStatus={watchEntry?.status || null}
                    currentRating={watchEntry?.rating || null}
                    onAddToWatchlist={() => handleAddToWatchlist(rec.media)}
                    onAddToWatched={() => handleAddToWatched(rec.media)}
                    onRate={watchEntryId ? (rating) => handleRate(watchEntryId, rating) : undefined}
                  />
                  {rec.reasons.length > 0 && (
                    <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs text-purple-700 dark:text-purple-300">
                      {rec.reasons[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loadingRecs && recommendations.length === 0 && watchedWithRatings > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Get Started
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Click &quot;Get Recommendations&quot; to see personalized suggestions based on your preferences.
          </p>
        </div>
      )}
    </div>
  );
}

