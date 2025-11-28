'use client';

import { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { X, Star, StarOff, Edit2, GripVertical } from 'lucide-react';
import type { FoodEntry } from '@/lib/types';
import { useFitness } from '@/hooks/useFitness';

interface FoodEntryCardProps {
  entry: FoodEntry;
  onRemove: (id: string) => void;
  onQuantityUpdate?: (id: string, quantity: number, unit: string) => void;
}

export default function FoodEntryCard({ entry, onRemove, onQuantityUpdate }: FoodEntryCardProps) {
  const { data, addFavoriteFood, removeFavoriteFood, updateFoodEntryQuantity } = useFitness();
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [editQuantity, setEditQuantity] = useState(entry.quantity.toString());
  const [editUnit, setEditUnit] = useState(entry.unit);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: entry.id,
    data: {
      type: 'food-entry',
      entry,
    },
  });

  // Get favorites directly from data to ensure reactivity
  // Component will re-render when data.favoriteFoods changes
  const favorites = data?.favoriteFoods || [];
  const isFavorite = favorites.some(
    (f) => f.name === entry.name && f.baseQuantity === entry.quantity && f.unit === entry.unit
  );
  
  // Update edit quantity when entry changes (e.g., after quantity update)
  useEffect(() => {
    if (!isEditingQuantity) {
      setEditQuantity(entry.quantity.toString());
      setEditUnit(entry.unit);
    }
  }, [entry.quantity, entry.unit, isEditingQuantity]);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFavorite) {
      // Find and remove from favorites
      const favorite = favorites.find(
        (f) => f.name === entry.name && f.baseQuantity === entry.quantity && f.unit === entry.unit
      );
      if (favorite) {
        removeFavoriteFood(favorite.id);
      }
    } else {
      // Add to favorites - use the entry's current quantity and macros
      addFavoriteFood({
        name: entry.name,
        baseQuantity: entry.quantity,
        unit: entry.unit,
        macros: entry.macros,
      });
    }
  };

  const handleSaveQuantity = () => {
    const qty = parseFloat(editQuantity);
    if (!isNaN(qty) && qty > 0) {
      updateFoodEntryQuantity(entry.id, qty, editUnit);
      setIsEditingQuantity(false);
    }
  };

  const handleCancelEdit = () => {
    setEditQuantity(entry.quantity.toString());
    setEditUnit(entry.unit);
    setIsEditingQuantity(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded transition-opacity ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{entry.name}</div>
          {isEditingQuantity ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                step="0.1"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveQuantity();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <input
                type="text"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleSaveQuantity}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {entry.quantity} {entry.unit} • {entry.macros.calories} cal
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isEditingQuantity && (
          <button
            onClick={() => setIsEditingQuantity(true)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Edit quantity"
          >
            <Edit2 size={16} className="text-gray-400 dark:text-gray-500" />
          </button>
        )}
        <button
          onClick={handleToggleFavorite}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <Star size={18} className="text-yellow-500 fill-yellow-500" />
          ) : (
            <StarOff size={18} className="text-gray-400" />
          )}
        </button>
        <button
          onClick={() => onRemove(entry.id)}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
          title="Remove"
        >
          <X size={18} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}

