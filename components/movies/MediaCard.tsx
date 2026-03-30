'use client';

import { Film, Tv, ThumbsUp, ThumbsDown, Plus, Check, X } from 'lucide-react';
import { useMovies } from '@/contexts/MoviesContext';
import type { MediaEntry, StreamingProvider } from '@/lib/types';
import { getPosterUrl } from '@/lib/api/movies';

interface MediaCardProps {
  media: MediaEntry & { posterUrl?: string | null; watchProviders?: StreamingProvider[] };
  showActions?: boolean;
  onAddToWatchlist?: () => void;
  onAddToWatched?: () => void;
  onRemove?: () => void;
  currentStatus?: 'watched' | 'watchlist' | null;
  currentRating?: 'thumbs_up' | 'thumbs_down' | null;
  onRate?: (rating: 'thumbs_up' | 'thumbs_down' | null) => void;
}

export default function MediaCard({
  media,
  showActions = true,
  onAddToWatchlist,
  onAddToWatched,
  onRemove,
  currentStatus,
  currentRating,
  onRate,
}: MediaCardProps) {
  const posterUrl = media.posterUrl || getPosterUrl(media.posterPath);
  const releaseDate = media.type === 'movie' ? media.releaseDate : media.firstAirDate;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-gray-100 dark:bg-gray-700">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={media.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            {media.type === 'movie' ? <Film size={48} /> : <Tv size={48} />}
          </div>
        )}
        
        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <div className={`px-2 py-1 rounded text-xs font-semibold ${
            media.type === 'movie' 
              ? 'bg-blue-500 text-white' 
              : 'bg-purple-500 text-white'
          }`}>
            {media.type === 'movie' ? 'Movie' : 'TV'}
          </div>
        </div>

        {/* Rating Badge */}
        {currentRating && (
          <div className="absolute top-2 right-2">
            <div className={`p-1.5 rounded-full ${
              currentRating === 'thumbs_up' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {currentRating === 'thumbs_up' ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
            </div>
          </div>
        )}

        {/* Action Overlay */}
        {showActions && (
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {currentStatus === 'watchlist' && (
              <button
                onClick={onRemove}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <X size={16} />
                Remove
              </button>
            )}
            {currentStatus === 'watched' && (
              <button
                onClick={onRemove}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <X size={16} />
                Remove
              </button>
            )}
            {!currentStatus && (
              <>
                <button
                  onClick={onAddToWatchlist}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Plus size={16} />
                  Watchlist
                </button>
                <button
                  onClick={onAddToWatched}
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Check size={16} />
                  Watched
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
          {media.title}
        </h3>
        {releaseDate && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {new Date(releaseDate).getFullYear()}
          </p>
        )}
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {media.overview}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">⭐</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {media.rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Streaming Providers */}
        {media.watchProviders && media.watchProviders.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {media.watchProviders
                .filter((p) => p.type === 'flatrate')
                .slice(0, 3)
                .map((provider) => (
                  <div
                    key={provider.providerId}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300"
                    title={provider.providerName}
                  >
                    {provider.providerName}
                  </div>
                ))}
            </div>
          </div>
        )}

        {currentStatus === 'watched' && onRate && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onRate(currentRating === 'thumbs_up' ? null : 'thumbs_up')}
              className={`flex-1 px-2 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                currentRating === 'thumbs_up'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <ThumbsUp size={14} />
              Up
            </button>
            <button
              onClick={() => onRate(currentRating === 'thumbs_down' ? null : 'thumbs_down')}
              className={`flex-1 px-2 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                currentRating === 'thumbs_down'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <ThumbsDown size={14} />
              Down
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

