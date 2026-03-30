'use client';

import { useState, useMemo } from 'react';
import { useMovies } from '@/contexts/MoviesContext';
import MediaCard from './MediaCard';
import { CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { MediaEntry, WatchEntry } from '@/lib/types';

type RatingFilter = 'all' | 'thumbs_up' | 'thumbs_down' | 'no_rating';

export default function Watched() {
  const { data, getWatched, removeFromList, rateItem } = useMovies();
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');

  const watched = useMemo(() => {
    let entries = getWatched();

    // Apply rating filter
    if (ratingFilter === 'thumbs_up') {
      entries = entries.filter((e) => e.rating === 'thumbs_up');
    } else if (ratingFilter === 'thumbs_down') {
      entries = entries.filter((e) => e.rating === 'thumbs_down');
    } else if (ratingFilter === 'no_rating') {
      entries = entries.filter((e) => !e.rating);
    }

    return entries
      .map((entry) => {
        const media = data?.mediaEntries.find((m) => m.id === entry.mediaId);
        return media ? { entry, media } : null;
      })
      .filter((item): item is { entry: WatchEntry; media: MediaEntry } => item !== null)
      .sort((a, b) => {
        const dateA = a.entry.watchedDate || a.entry.addedDate;
        const dateB = b.entry.watchedDate || b.entry.addedDate;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [data, getWatched, ratingFilter]);

  if (!data) return null;

  if (getWatched().length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Watched Items Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Mark movies and shows as watched to track what you&apos;ve seen.
        </p>
      </div>
    );
  }

  const allWatched = getWatched();
  const stats = {
    total: allWatched.length,
    thumbsUp: allWatched.filter((e) => e.rating === 'thumbs_up').length,
    thumbsDown: allWatched.filter((e) => e.rating === 'thumbs_down').length,
    noRating: allWatched.filter((e) => !e.rating).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Watched ({stats.total})
        </h2>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setRatingFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              ratingFilter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setRatingFilter('thumbs_up')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
              ratingFilter === 'thumbs_up'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ThumbsUp size={14} />
            Up ({stats.thumbsUp})
          </button>
          <button
            onClick={() => setRatingFilter('thumbs_down')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
              ratingFilter === 'thumbs_down'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ThumbsDown size={14} />
            Down ({stats.thumbsDown})
          </button>
          <button
            onClick={() => setRatingFilter('no_rating')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              ratingFilter === 'no_rating'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            No Rating ({stats.noRating})
          </button>
        </div>
      </div>

      {watched.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No items match the selected filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {watched.map(({ entry, media }) => (
            <MediaCard
              key={entry.id}
              media={media}
              currentStatus="watched"
              currentRating={entry.rating || null}
              onRemove={() => removeFromList(entry.id)}
              onRate={(rating) => rateItem(entry.id, rating)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

