'use client';

import { useMemo } from 'react';
import { useMovies } from '@/contexts/MoviesContext';
import MediaCard from './MediaCard';
import { List, Film } from 'lucide-react';
import type { MediaEntry, WatchEntry } from '@/lib/types';

export default function Watchlist() {
  const { data, getWatchlist, removeFromList, addToWatched } = useMovies();
  
  const watchlist = useMemo(() => {
    const entries = getWatchlist();
    return entries
      .map((entry) => {
        const media = data?.mediaEntries.find((m) => m.id === entry.mediaId);
        return media ? { entry, media } : null;
      })
      .filter((item): item is { entry: WatchEntry; media: MediaEntry } => item !== null)
      .sort((a, b) => new Date(b.entry.addedDate).getTime() - new Date(a.entry.addedDate).getTime());
  }, [data, getWatchlist]);

  if (!data) return null;

  if (watchlist.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <List className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Your Watchlist is Empty
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Search for movies and TV shows to add them to your watchlist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Watchlist ({watchlist.length})
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {watchlist.map(({ entry, media }) => (
          <MediaCard
            key={entry.id}
            media={media}
            currentStatus="watchlist"
            onRemove={() => removeFromList(entry.id)}
            onAddToWatched={() => {
              removeFromList(entry.id);
              addToWatched(media.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

