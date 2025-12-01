'use client';

import { useState } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { X } from 'lucide-react';
import type { FavoriteFood, MealType } from '@/lib/types';
import { calculateMacrosForQuantity } from '@/lib/api/food';

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

interface FavoriteAddModalProps {
  favorite: FavoriteFood;
  onClose: () => void;
}

export default function FavoriteAddModal({ favorite, onClose }: FavoriteAddModalProps) {
  const { addFoodEntry } = useFitness();
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [quantity, setQuantity] = useState(favorite.baseQuantity.toString());
  const [unit, setUnit] = useState(favorite.unit);
  const [isAdding, setIsAdding] = useState(false);

  const targetQuantity = parseFloat(quantity) || favorite.baseQuantity;
  const calculatedMacros = calculateMacrosForQuantity(
    favorite.macros,
    favorite.baseQuantity,
    targetQuantity
  );

  const handleAdd = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isAdding) return;
    setIsAdding(true);

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setIsAdding(false);
      return;
    }

    addFoodEntry({
      name: favorite.name,
      mealType: selectedMeal,
      quantity: qty,
      unit: unit,
      macros: calculatedMacros,
    });
    
    setTimeout(() => {
      setIsAdding(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add {favorite.name}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meal Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((meal) => (
                <button
                  key={meal.value}
                  onClick={() => setSelectedMeal(meal.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedMeal === meal.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {meal.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="0.1"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="g">g</option>
                <option value="oz">oz</option>
                <option value="cup">cup</option>
                <option value="piece">piece</option>
                <option value="ml">ml</option>
                <option value="tbsp">tbsp</option>
                <option value="tsp">tsp</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Macros (for {quantity} {unit})
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                  {calculatedMacros.calories}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Protein:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                  {calculatedMacros.protein}g
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Carbs:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                  {calculatedMacros.carbs}g
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Fat:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                  {calculatedMacros.fat}g
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAdd();
              }}
              disabled={isAdding || !quantity || parseFloat(quantity) <= 0}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isAdding ? 'Adding...' : 'Add to Meal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

