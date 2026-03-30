'use client';

import { useState } from 'react';
import { useFitness } from '@/hooks/useFitness';
import FoodSearch from './FoodSearch';
import FoodEntryCard from './FoodEntryCard';
import MealDropZone from './MealDropZone';
import { UtensilsCrossed, Plus, X } from 'lucide-react';
import type { MealType, FoodEntry } from '@/lib/types';
import { calculateMacrosForQuantity } from '@/lib/api/food';
import { format } from 'date-fns';
import { isSameDay, getStartOfDay } from '@/lib/utils/date';

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

interface FoodLoggerProps {
  activeDragId?: string | null;
}

export default function FoodLogger({ activeDragId }: FoodLoggerProps = {}) {
  const { data, addFoodEntry, removeFoodEntry, updateFoodEntryQuantity } = useFitness();
  const [entryMode, setEntryMode] = useState<'search' | 'manual'>('search');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [selectedFood, setSelectedFood] = useState<{ name: string; macros: any; unit: string } | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('g');
  const [isAdding, setIsAdding] = useState(false);
  
  // Manual entry state
  const [manualFood, setManualFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    quantity: '100',
    unit: 'g',
  });

  if (!data) return null;

  // Use data directly for proper reactivity - filter today's entries
  const today = getStartOfDay(new Date());
  const todayEntries = data.foodEntries.filter((entry) =>
    isSameDay(entry.timestamp, today)
  );

  const handleFoodSelect = (food: any) => {
    setSelectedFood({
      name: food.name,
      macros: {
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        ...(food.fiber != null && { fiber: food.fiber }),
        ...(food.sugar != null && { sugar: food.sugar }),
        ...(food.sodium != null && { sodium: food.sodium }),
      },
      unit: food.unit || 'g',
    });
    setUnit(food.unit || 'g');
    setShowSearch(false);
  };

  const handleAddFood = () => {
    // Prevent double submission
    if (isAdding) return;
    setIsAdding(true);

    if (entryMode === 'search') {
      if (!selectedFood || !quantity || isNaN(parseFloat(quantity))) {
        setIsAdding(false);
        return;
      }

      const baseQuantity = 100; // Most APIs return per 100g
      const targetQuantity = parseFloat(quantity);
      const calculatedMacros = calculateMacrosForQuantity(
        selectedFood.macros,
        baseQuantity,
        targetQuantity
      );

      addFoodEntry({
        name: selectedFood.name,
        mealType: selectedMeal,
        quantity: targetQuantity,
        unit: unit,
        macros: calculatedMacros,
      });

      // Reset form
      setSelectedFood(null);
      setQuantity('100');
      setUnit('g');
      setShowSearch(false);
    } else {
      // Manual entry
      if (!manualFood.name || !manualFood.calories || !manualFood.quantity || 
          isNaN(parseFloat(manualFood.calories)) || isNaN(parseFloat(manualFood.quantity))) {
        setIsAdding(false);
        return;
      }

      const targetQuantity = parseFloat(manualFood.quantity);
      
      // The user enters macros for the quantity they specify, so use them directly
      const macros = {
        calories: Math.round(parseFloat(manualFood.calories)),
        protein: Math.round(parseFloat(manualFood.protein || '0') * 10) / 10,
        carbs: Math.round(parseFloat(manualFood.carbs || '0') * 10) / 10,
        fat: Math.round(parseFloat(manualFood.fat || '0') * 10) / 10,
      };

      addFoodEntry({
        name: manualFood.name,
        mealType: selectedMeal,
        quantity: targetQuantity,
        unit: manualFood.unit,
        macros: macros,
      });

      // Reset form
      setManualFood({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        quantity: '100',
        unit: 'g',
      });
    }

    // Reset adding flag after a short delay to allow state update
    setTimeout(() => {
      setIsAdding(false);
    }, 100);
  };


  const getMealEntries = (mealType: MealType) => {
    return todayEntries.filter((entry) => entry.mealType === mealType);
  };

  const getMealTotal = (mealType: MealType) => {
    const entries = getMealEntries(mealType);
    return entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.macros.calories,
        protein: acc.protein + entry.macros.protein,
        carbs: acc.carbs + entry.macros.carbs,
        fat: acc.fat + entry.macros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <UtensilsCrossed className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Food Logger</h2>
      </div>


      {/* Entry Mode Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            setEntryMode('search');
            setShowSearch(false);
            setSelectedFood(null);
          }}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            entryMode === 'search'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Search Food
        </button>
        <button
          onClick={() => {
            setEntryMode('manual');
            setShowSearch(false);
            setSelectedFood(null);
          }}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            entryMode === 'manual'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Manual Entry
        </button>
      </div>

      {/* Add Food Form */}
      <div className="mb-6 space-y-4">
        {entryMode === 'search' && (
          <>
            {!showSearch && !selectedFood && (
              <button
                onClick={() => setShowSearch(true)}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Search for food
              </button>
            )}

            {showSearch && !selectedFood && (
              <div className="relative">
                <FoodSearch onSelect={handleFoodSelect} onClose={() => setShowSearch(false)} />
              </div>
            )}
          </>
        )}

        {entryMode === 'manual' && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Food Name
              </label>
              <input
                type="text"
                value={manualFood.name}
                onChange={(e) => setManualFood({ ...manualFood, name: e.target.value })}
                placeholder="e.g., Chicken Breast"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={manualFood.quantity}
                    onChange={(e) => setManualFood({ ...manualFood, quantity: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="100"
                  />
                  <input
                    type="text"
                    value={manualFood.unit}
                    onChange={(e) => setManualFood({ ...manualFood, unit: e.target.value })}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="g"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calories (per {manualFood.quantity} {manualFood.unit})
                </label>
                <input
                  type="number"
                  step="1"
                  value={manualFood.calories}
                  onChange={(e) => setManualFood({ ...manualFood, calories: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="200"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Protein (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualFood.protein}
                  onChange={(e) => setManualFood({ ...manualFood, protein: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualFood.carbs}
                  onChange={(e) => setManualFood({ ...manualFood, carbs: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualFood.fat}
                  onChange={(e) => setManualFood({ ...manualFood, fat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meal Type
              </label>
              <select
                value={selectedMeal}
                onChange={(e) => setSelectedMeal(e.target.value as MealType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {MEAL_TYPES.map((meal) => (
                  <option key={meal.value} value={meal.value}>
                    {meal.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddFood();
              }}
              disabled={!manualFood.name || !manualFood.calories || !manualFood.quantity || isAdding}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : `Add to ${MEAL_TYPES.find((m) => m.value === selectedMeal)?.label}`}
            </button>
          </div>
        )}

        {entryMode === 'search' && selectedFood && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{selectedFood.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFood.macros.calories} cal • {selectedFood.macros.protein}g protein • {selectedFood.macros.carbs}g carbs • {selectedFood.macros.fat}g fat
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFood(null);
                  setShowSearch(false);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meal Type
                </label>
                <select
                  value={selectedMeal}
                  onChange={(e) => setSelectedMeal(e.target.value as MealType)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {MEAL_TYPES.map((meal) => (
                    <option key={meal.value} value={meal.value}>
                      {meal.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="g"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddFood();
              }}
              disabled={isAdding}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : `Add to ${MEAL_TYPES.find((m) => m.value === selectedMeal)?.label}`}
            </button>
          </div>
        )}
      </div>

      {/* Today's Food Entries by Meal */}
      <div className="space-y-4">
        {MEAL_TYPES.map((meal) => {
          const entries = getMealEntries(meal.value);
          const total = getMealTotal(meal.value);

          return (
            <MealDropZone key={meal.value} mealType={meal.value} label={meal.label}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{meal.label}</h3>
                {entries.length > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {total.calories} cal • P: {total.protein.toFixed(1)}g • C: {total.carbs.toFixed(1)}g • F: {total.fat.toFixed(1)}g
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {entries.length === 0 ? (
                  <div className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                    Drop food here or add new entries
                  </div>
                ) : (
                  entries.map((entry) => (
                    <FoodEntryCard
                      key={entry.id}
                      entry={entry}
                      onRemove={removeFoodEntry}
                    />
                  ))
                )}
              </div>
            </MealDropZone>
          );
        })}
      </div>
    </div>
  );
}

