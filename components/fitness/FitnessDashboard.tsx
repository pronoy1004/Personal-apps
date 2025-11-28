'use client';

import { useState } from 'react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useFitness } from '@/hooks/useFitness';
import { getStartOfDay, isSameDay } from '@/lib/utils/date';
import WeightTracker from './WeightTracker';
import FoodLogger from './FoodLogger';
import WorkoutLogger from './WorkoutLogger';
import DailySummary from './DailySummary';
import WeightProjections from './WeightProjections';
import FitnessSettings from './FitnessSettings';
import { Calendar, Settings, TrendingUp, UtensilsCrossed, Activity } from 'lucide-react';
import type { MealType } from '@/lib/types';

type Tab = 'today' | 'history' | 'projections' | 'settings';

export default function FitnessDashboard() {
  const { data, loading, addFoodEntry, updateFoodEntryMeal } = useFitness();
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || !data) return;

    // Use data directly for proper reactivity - filter today's entries
    const today = getStartOfDay(new Date());
    const todayEntries = data.foodEntries.filter((entry) =>
      isSameDay(entry.timestamp, today)
    );

    // Check if dragging a favorite
    if (active.id.toString().startsWith('favorite-')) {
      const favoriteId = active.id.toString().replace('favorite-', '');
      console.log('Dragging favorite, ID:', favoriteId);
      const favorite = data.favoriteFoods.find((f) => f.id === favoriteId);
      
      console.log('Found favorite:', favorite);
      console.log('Drop target:', over.id);
      
      if (favorite) {
        // Check if dropped on a meal type droppable
        const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
        const targetMeal = mealTypes.find((meal) => over.id === `meal-${meal}`);
        
        console.log('Target meal:', targetMeal);
        
        if (targetMeal) {
          console.log('Adding favorite to meal:', {
            name: favorite.name,
            mealType: targetMeal,
            quantity: favorite.baseQuantity,
            unit: favorite.unit,
            macros: favorite.macros,
          });
          
          // Add favorite to meal
          addFoodEntry({
            name: favorite.name,
            mealType: targetMeal,
            quantity: favorite.baseQuantity,
            unit: favorite.unit,
            macros: favorite.macros,
          });
          
          console.log('Food entry added via drag-drop');
        } else {
          console.log('Not dropped on a valid meal zone');
        }
      } else {
        console.log('Favorite not found');
      }
      return;
    }

    // Handle food entry drag
    const activeEntry = todayEntries.find((e) => e.id === active.id);
    if (!activeEntry) return;

    // Check if dropped on a meal type droppable
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    const targetMeal = mealTypes.find((meal) => over.id === `meal-${meal}`);

    if (targetMeal && targetMeal !== activeEntry.mealType) {
      updateFoodEntryMeal(active.id, targetMeal);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading fitness data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs - Desktop */}
      <div className="hidden md:flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'today'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            Today
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={18} />
            History
          </div>
        </button>
        <button
          onClick={() => setActiveTab('projections')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'projections'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity size={18} />
            Projections
          </div>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'settings'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings size={18} />
            Settings
          </div>
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-30 safe-area-inset-bottom">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center justify-center py-3 px-2 min-h-[60px] transition-colors ${
              activeTab === 'today'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <Calendar size={20} />
            <span className="text-xs mt-1 font-medium">Today</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-3 px-2 min-h-[60px] transition-colors ${
              activeTab === 'history'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <TrendingUp size={20} />
            <span className="text-xs mt-1 font-medium">History</span>
          </button>
          <button
            onClick={() => setActiveTab('projections')}
            className={`flex flex-col items-center justify-center py-3 px-2 min-h-[60px] transition-colors ${
              activeTab === 'projections'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <Activity size={20} />
            <span className="text-xs mt-1 font-medium">Projections</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-3 px-2 min-h-[60px] transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <Settings size={20} />
            <span className="text-xs mt-1 font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4 md:mt-6 pb-20 md:pb-6">
        {activeTab === 'today' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                  <WeightTracker />
                  <FoodLogger activeDragId={activeDragId} />
                  <WorkoutLogger />
                </div>
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <DailySummary />
                </div>
              </div>
            </div>
            <DragOverlay>
              {activeDragId ? (
                <div className="opacity-50 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  Dragging...
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <WeightTracker showHistory={true} />
            {/* Additional history views can be added here */}
          </div>
        )}

        {activeTab === 'projections' && (
          <WeightProjections />
        )}

        {activeTab === 'settings' && (
          <FitnessSettings />
        )}
      </div>
    </div>
  );
}

