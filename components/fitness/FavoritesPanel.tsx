'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useFitness } from '@/hooks/useFitness';
import { Star, Trash2, Search } from 'lucide-react';
import type { FavoriteFood } from '@/lib/types';
import FavoriteAddModal from './FavoriteAddModal';
import FavoriteCard from './FavoriteCard';

export default function FavoritesPanel() {
  const { data, removeFavoriteFood } = useFitness();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFavorite, setSelectedFavorite] = useState<FavoriteFood | null>(null);

  if (!data) return null;

  // Get favorites directly from data to ensure reactivity
  const favorites = data.favoriteFoods || [];
  const filteredFavorites = favorites.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Favorites
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {favorites.length}
        </span>
      </div>

      {favorites.length > 0 && (
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchQuery ? (
              <p className="text-sm">No favorites match your search</p>
            ) : favorites.length === 0 ? (
              <div>
                <Star className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">No favorites yet</p>
                <p className="text-xs mt-1">Star a food item to add it here</p>
              </div>
            ) : null}
          </div>
        ) : (
          filteredFavorites.map((favorite) => (
            <div key={favorite.id} className="flex items-center gap-2">
              <FavoriteCard
                favorite={favorite}
                onRemove={() => removeFavoriteFood(favorite.id)}
                onClick={() => setSelectedFavorite(favorite)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavoriteFood(favorite.id);
                }}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
                title="Remove from favorites"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {selectedFavorite && (
        <FavoriteAddModal
          favorite={selectedFavorite}
          onClose={() => setSelectedFavorite(null)}
        />
      )}
    </div>
  );
}

