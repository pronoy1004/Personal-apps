'use client';

import { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { X, Star, StarOff, Edit2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showDetails, setShowDetails] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: entry.id,
    data: { type: 'food-entry', entry },
  });

  const favorites = data?.favoriteFoods || [];
  const isFavorite = favorites.some(
    (f) => f.name === entry.name && f.baseQuantity === entry.quantity && f.unit === entry.unit
  );

  useEffect(() => {
    if (!isEditingQuantity) {
      setEditQuantity(entry.quantity.toString());
      setEditUnit(entry.unit);
    }
  }, [entry.quantity, entry.unit, isEditingQuantity]);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFavorite) {
      const favorite = favorites.find(
        (f) => f.name === entry.name && f.baseQuantity === entry.quantity && f.unit === entry.unit
      );
      if (favorite) removeFavoriteFood(favorite.id);
    } else {
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

  const hasMicronutrients = entry.macros.fiber != null || entry.macros.sugar != null || entry.macros.sodium != null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 dark:bg-gray-700/50 rounded transition-opacity ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Main Row */}
      <div className="flex items-center justify-between p-2">
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
                  className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {entry.quantity}{entry.unit} · {entry.macros.calories}cal · P{entry.macros.protein.toFixed(0)} C{entry.macros.carbs.toFixed(0)} F{entry.macros.fat.toFixed(0)}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasMicronutrients && !isEditingQuantity && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Show micronutrients"
            >
              {showDetails
                ? <ChevronUp size={14} className="text-gray-400" />
                : <ChevronDown size={14} className="text-gray-400" />}
            </button>
          )}
          {!isEditingQuantity && (
            <button
              onClick={() => setIsEditingQuantity(true)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Edit quantity"
            >
              <Edit2 size={15} className="text-gray-400" />
            </button>
          )}
          <button
            onClick={handleToggleFavorite}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite
              ? <Star size={16} className="text-yellow-500 fill-yellow-500" />
              : <StarOff size={16} className="text-gray-400" />}
          </button>
          <button
            onClick={() => onRemove(entry.id)}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Remove"
          >
            <X size={16} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* Micronutrient Details */}
      {showDetails && hasMicronutrients && (
        <div className="px-3 pb-2 flex gap-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-1.5">
          {entry.macros.fiber != null && (
            <span className="text-green-600 dark:text-green-400">Fiber {entry.macros.fiber.toFixed(1)}g</span>
          )}
          {entry.macros.sugar != null && (
            <span className="text-pink-600 dark:text-pink-400">Sugar {entry.macros.sugar.toFixed(1)}g</span>
          )}
          {entry.macros.sodium != null && (
            <span className={entry.macros.sodium > 500 ? 'text-orange-500' : ''}>
              Sodium {entry.macros.sodium >= 1000 ? `${(entry.macros.sodium / 1000).toFixed(1)}g` : `${Math.round(entry.macros.sodium)}mg`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
