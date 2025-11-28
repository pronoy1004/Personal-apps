'use client';

import { useFitness } from '@/hooks/useFitness';
import { calculateTDEE, calculateDailyBalance } from '@/lib/utils/tdee';
import { calculateMacroDistribution } from '@/lib/utils/macros';
import { getStartOfDay, isSameDay } from '@/lib/utils/date';
import { Target, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import FavoritesPanel from './FavoritesPanel';

export default function DailySummary() {
  const { data } = useFitness();

  if (!data) return null;

  // Use data directly for proper reactivity - filter today's entries
  const today = getStartOfDay(new Date());
  const todayFoodEntries = data.foodEntries.filter((entry) =>
    isSameDay(entry.timestamp, today)
  );
  const todayWorkouts = data.workoutEntries.filter((entry) =>
    isSameDay(entry.date, today)
  );
  const currentWeight = data.weightEntries.length > 0
    ? data.weightEntries[data.weightEntries.length - 1].weight
    : 102; // Default weight

  // Calculate total macros consumed
  const totalMacros = todayFoodEntries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.macros.calories,
      protein: acc.protein + entry.macros.protein,
      carbs: acc.carbs + entry.macros.carbs,
      fat: acc.fat + entry.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Calculate TDEE (activity multiplier already accounts for exercise)
  const tdee = calculateTDEE(
    currentWeight,
    data.userProfile.height,
    data.userProfile.age,
    data.userProfile.gender,
    data.userProfile.activityLevel
  );

  // Calculate balance
  const balance = calculateDailyBalance(totalMacros.calories, tdee);
  const goal = data.userProfile.dailyCalorieGoal || tdee - 1000; // Default 1000 cal deficit
  const remaining = goal - totalMacros.calories;

  // Calculate macro distribution based on goals or TDEE
  const macroGoals = data.userProfile.macroGoals;
  const macroDistribution = calculateMacroDistribution(
    tdee,
    macroGoals?.protein,
    macroGoals?.carbs,
    macroGoals?.fat
  );

  // Calculate macro calories from consumed macros
  const proteinCalories = totalMacros.protein * 4;
  const carbsCalories = totalMacros.carbs * 4;
  const fatCalories = totalMacros.fat * 9;
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

  // Calculate percentages of total calories CONSUMED (these should add up to 100%)
  // This shows what % of your consumed calories come from each macro
  // Use totalMacroCalories as denominator to ensure percentages add up to 100%
  const totalCaloriesConsumed = totalMacroCalories > 0 ? totalMacroCalories : totalMacros.calories || 1;
  const proteinPercentOfConsumed = (proteinCalories / totalCaloriesConsumed) * 100;
  const carbsPercentOfConsumed = (carbsCalories / totalCaloriesConsumed) * 100;
  const fatPercentOfConsumed = (fatCalories / totalCaloriesConsumed) * 100;

  // Calculate progress toward goals (for progress bars)
  // This shows what % of your goal you've consumed
  const proteinGoal = macroGoals?.protein && macroGoals.protein > 0 
    ? macroGoals.protein 
    : macroDistribution.protein;
  const carbsGoal = macroGoals?.carbs && macroGoals.carbs > 0 
    ? macroGoals.carbs 
    : macroDistribution.carbs;
  const fatGoal = macroGoals?.fat && macroGoals.fat > 0 
    ? macroGoals.fat 
    : macroDistribution.fat;

  const proteinProgress = proteinGoal > 0 ? (totalMacros.protein / proteinGoal) * 100 : 0;
  const carbsProgress = carbsGoal > 0 ? (totalMacros.carbs / carbsGoal) * 100 : 0;
  const fatProgress = fatGoal > 0 ? (totalMacros.fat / fatGoal) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:sticky lg:top-4">
      <div className="flex items-center gap-3 mb-6">
        <Target className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Daily Summary</h2>
      </div>

      {/* Calories */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Calories</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(totalMacros.calories)} / {goal}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              totalMacros.calories > goal
                ? 'bg-red-500'
                : totalMacros.calories > goal * 0.9
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((totalMacros.calories / goal) * 100, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Remaining</span>
          <span
            className={`font-semibold ${
              remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {remaining >= 0 ? '+' : ''}
            {Math.round(remaining)} cal
          </span>
        </div>
      </div>

      {/* TDEE and Balance */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">TDEE</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{tdee} cal</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Based on {data.userProfile.activityLevel.replace('_', ' ')} activity level
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Balance</span>
            <div className="flex items-center gap-2">
              {balance < 0 ? (
                <TrendingDown className="text-green-500" size={18} />
              ) : balance > 0 ? (
                <TrendingUp className="text-red-500" size={18} />
              ) : (
                <Minus className="text-gray-400" size={18} />
              )}
              <span
                className={`font-semibold ${
                  balance < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {balance > 0 ? '+' : ''}
                {Math.round(balance)} cal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Macros</h3>

        {/* Protein */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">Protein</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {totalMacros.protein.toFixed(1)}g
              {proteinGoal > 0 ? (
                <span className="text-gray-600 dark:text-gray-400">
                  {' '}/ {proteinGoal.toFixed(0)}g ({proteinPercentOfConsumed.toFixed(0)}%)
                </span>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">
                  {' '}({proteinPercentOfConsumed.toFixed(0)}%)
                </span>
              )}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(proteinProgress, 100)}%` }}
            />
          </div>
          {proteinGoal > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Goal: {proteinGoal.toFixed(1)}g ({proteinPercentOfConsumed.toFixed(0)}% of consumed)
            </div>
          )}
        </div>

        {/* Carbs */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">Carbs</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {totalMacros.carbs.toFixed(1)}g
              {carbsGoal > 0 ? (
                <span className="text-gray-600 dark:text-gray-400">
                  {' '}/ {carbsGoal.toFixed(0)}g ({carbsPercentOfConsumed.toFixed(0)}%)
                </span>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">
                  {' '}({carbsPercentOfConsumed.toFixed(0)}%)
                </span>
              )}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(carbsProgress, 100)}%` }}
            />
          </div>
          {carbsGoal > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Goal: {carbsGoal.toFixed(1)}g ({carbsPercentOfConsumed.toFixed(0)}% of consumed)
            </div>
          )}
        </div>

        {/* Fat */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">Fat</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {totalMacros.fat.toFixed(1)}g
              {fatGoal > 0 ? (
                <span className="text-gray-600 dark:text-gray-400">
                  {' '}/ {fatGoal.toFixed(0)}g ({fatPercentOfConsumed.toFixed(0)}%)
                </span>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">
                  {' '}({fatPercentOfConsumed.toFixed(0)}%)
                </span>
              )}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(fatProgress, 100)}%` }}
            />
          </div>
          {fatGoal > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Goal: {fatGoal.toFixed(1)}g ({fatPercentOfConsumed.toFixed(0)}% of consumed)
            </div>
          )}
        </div>
      </div>

      {/* Favorites Panel */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <FavoritesPanel />
      </div>
    </div>
  );
}

