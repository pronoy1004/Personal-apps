'use client';

import { useFitness } from '@/hooks/useFitness';
import { calculateTDEE, calculateActualTDEE, calculateDailyBalance } from '@/lib/utils/tdee';
import { calculateMacroDistribution } from '@/lib/utils/macros';
import { getStartOfDay, isSameDay } from '@/lib/utils/date';
import { calculateFoodLoggingStreak, calculateWorkoutStreak, calculateBMI, getBMICategory } from '@/lib/utils/streaks';
import { Target, TrendingDown, TrendingUp, Minus, Flame, Dumbbell, Droplets } from 'lucide-react';
import FavoritesPanel from './FavoritesPanel';

export default function DailySummary() {
  const { data, getTodayWaterTotal } = useFitness();

  if (!data) return null;

  const today = getStartOfDay(new Date());
  const todayFoodEntries = data.foodEntries.filter((entry) =>
    isSameDay(entry.timestamp, today)
  );

  const getEstimatedWeight = (height: number, gender: string): number => {
    const heightM = height / 100;
    const bmiTarget = gender === 'male' ? 22 : 21;
    return Math.round(heightM * heightM * bmiTarget);
  };

  const currentWeight = data.weightEntries.length > 0
    ? data.weightEntries[data.weightEntries.length - 1].weight
    : getEstimatedWeight(data.userProfile.height, data.userProfile.gender);

  const totalMacros = todayFoodEntries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.macros.calories,
      protein: acc.protein + entry.macros.protein,
      carbs: acc.carbs + entry.macros.carbs,
      fat: acc.fat + entry.macros.fat,
      fiber: (acc.fiber || 0) + (entry.macros.fiber || 0),
      sugar: (acc.sugar || 0) + (entry.macros.sugar || 0),
      sodium: (acc.sodium || 0) + (entry.macros.sodium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  );

  const formulaTDEE = calculateTDEE(
    currentWeight,
    data.userProfile.height,
    data.userProfile.age,
    data.userProfile.gender,
    data.userProfile.activityLevel
  );

  const actualTDEEResult = calculateActualTDEE(
    data.weightEntries,
    data.foodEntries,
    data.userProfile.height,
    data.userProfile.age,
    data.userProfile.gender,
    data.userProfile.activityLevel,
    14,
    data.workoutEntries
  );

  const tdee = actualTDEEResult?.actualTDEE || formulaTDEE;
  const hasActualTDEE = actualTDEEResult !== null;
  const balance = calculateDailyBalance(totalMacros.calories, tdee);
  const goal = data.userProfile.dailyCalorieGoal || tdee - 1000;
  const remaining = goal - totalMacros.calories;

  const macroGoals = data.userProfile.macroGoals;
  const macroDistribution = calculateMacroDistribution(
    tdee,
    macroGoals?.protein,
    macroGoals?.carbs,
    macroGoals?.fat
  );

  const proteinGoal = macroGoals?.protein && macroGoals.protein > 0 ? macroGoals.protein : macroDistribution.protein;
  const carbsGoal = macroGoals?.carbs && macroGoals.carbs > 0 ? macroGoals.carbs : macroDistribution.carbs;
  const fatGoal = macroGoals?.fat && macroGoals.fat > 0 ? macroGoals.fat : macroDistribution.fat;

  const proteinProgress = proteinGoal > 0 ? Math.min((totalMacros.protein / proteinGoal) * 100, 100) : 0;
  const carbsProgress = carbsGoal > 0 ? Math.min((totalMacros.carbs / carbsGoal) * 100, 100) : 0;
  const fatProgress = fatGoal > 0 ? Math.min((totalMacros.fat / fatGoal) * 100, 100) : 0;

  const proteinCal = totalMacros.protein * 4;
  const carbsCal = totalMacros.carbs * 4;
  const fatCal = totalMacros.fat * 9;
  const totalMacroCal = proteinCal + carbsCal + fatCal || 1;
  const proteinPct = Math.round((proteinCal / totalMacroCal) * 100);
  const carbsPct = Math.round((carbsCal / totalMacroCal) * 100);
  const fatPct = Math.round((fatCal / totalMacroCal) * 100);

  const foodStreak = calculateFoodLoggingStreak(data.foodEntries);
  const workoutStreak = calculateWorkoutStreak(data.workoutEntries);

  const bmi = calculateBMI(currentWeight, data.userProfile.height);
  const bmiCategory = getBMICategory(bmi);

  const waterTotal = getTodayWaterTotal();
  const waterGoal = data.settings.waterGoalMl || 2500;
  const waterPct = Math.min((waterTotal / waterGoal) * 100, 100);

  // SVG donut chart
  const DonutChart = () => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const hasData = totalMacroCal > 1;

    if (!hasData) {
      return (
        <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-600">
          <span className="text-xs text-gray-400 text-center px-1">No data</span>
        </div>
      );
    }

    const segments = [
      { pct: proteinPct, color: '#ef4444' },
      { pct: carbsPct, color: '#3b82f6' },
      { pct: fatPct, color: '#eab308' },
    ];

    let cumulativeOffset = 0;
    const arcs = segments.map((seg) => {
      const dash = (seg.pct / 100) * circumference;
      const arc = { ...seg, dash, offset: cumulativeOffset };
      cumulativeOffset += dash;
      return arc;
    });

    return (
      <svg width={100} height={100} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx={50} cy={50} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={14} className="dark:stroke-gray-600" />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={50}
            cy={50}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={14}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
          />
        ))}
      </svg>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:sticky lg:top-4">
      <div className="flex items-center gap-3 mb-5">
        <Target className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Daily Summary</h2>
      </div>

      {/* Streak Badges */}
      {(foodStreak > 0 || workoutStreak > 0) && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {foodStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-full">
              <Flame size={13} className="text-orange-500" />
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                {foodStreak}d streak
              </span>
            </div>
          )}
          {workoutStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-full">
              <Dumbbell size={13} className="text-purple-500" />
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                {workoutStreak}d active
              </span>
            </div>
          )}
        </div>
      )}

      {/* Calories */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Calories</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(totalMacros.calories)}{' '}
            <span className="text-base font-normal text-gray-500">/ {goal}</span>
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              totalMacros.calories > goal ? 'bg-red-500' :
              totalMacros.calories > goal * 0.9 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((totalMacros.calories / goal) * 100, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Remaining</span>
          <span className={`font-semibold ${remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {remaining >= 0 ? '+' : ''}{Math.round(remaining)} cal
          </span>
        </div>
      </div>

      {/* TDEE & Balance */}
      <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">TDEE</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{tdee} cal</span>
            {hasActualTDEE && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                actual
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600 mt-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Balance</span>
          <div className="flex items-center gap-1.5">
            {balance < 0 ? <TrendingDown className="text-green-500" size={16} /> :
             balance > 0 ? <TrendingUp className="text-red-500" size={16} /> :
             <Minus className="text-gray-400" size={16} />}
            <span className={`font-semibold text-sm ${balance < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {balance > 0 ? '+' : ''}{Math.round(balance)} cal
            </span>
          </div>
        </div>
      </div>

      {/* Macro Donut + Progress bars */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Macros</h3>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <DonutChart />
          </div>
          <div className="flex-1 space-y-2">
            {[
              { label: 'P', fullLabel: 'Protein', color: 'bg-red-500', value: totalMacros.protein, goal: proteinGoal, progress: proteinProgress, pct: proteinPct },
              { label: 'C', fullLabel: 'Carbs', color: 'bg-blue-500', value: totalMacros.carbs, goal: carbsGoal, progress: carbsProgress, pct: carbsPct },
              { label: 'F', fullLabel: 'Fat', color: 'bg-yellow-500', value: totalMacros.fat, goal: fatGoal, progress: fatProgress, pct: fatPct },
            ].map((macro) => (
              <div key={macro.label} className="text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-gray-700 dark:text-gray-300">{macro.fullLabel} <span className="text-gray-400">({macro.pct}%)</span></span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {macro.value.toFixed(0)}g<span className="text-gray-400">/{macro.goal.toFixed(0)}g</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className={`${macro.color} h-1.5 rounded-full transition-all`} style={{ width: `${macro.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Micronutrients */}
      {(totalMacros.fiber > 0 || totalMacros.sugar > 0 || totalMacros.sodium > 0) && (
        <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Micronutrients</h4>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            {totalMacros.fiber > 0 && (
              <div>
                <div className="font-bold text-green-600 dark:text-green-400">{totalMacros.fiber.toFixed(1)}g</div>
                <div className="text-gray-500">Fiber</div>
              </div>
            )}
            {totalMacros.sugar > 0 && (
              <div>
                <div className="font-bold text-pink-600 dark:text-pink-400">{totalMacros.sugar.toFixed(1)}g</div>
                <div className="text-gray-500">Sugar</div>
              </div>
            )}
            {totalMacros.sodium > 0 && (
              <div>
                <div className={`font-bold ${totalMacros.sodium > 2300 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {totalMacros.sodium >= 1000
                    ? `${(totalMacros.sodium / 1000).toFixed(1)}g`
                    : `${Math.round(totalMacros.sodium)}mg`}
                </div>
                <div className="text-gray-500">{totalMacros.sodium > 2300 ? 'Sodium ⚠' : 'Sodium'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Water */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Droplets size={14} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Water</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {(waterTotal / 1000).toFixed(1)}L{' '}
            <span className="text-gray-400 font-normal">/ {(waterGoal / 1000).toFixed(1)}L</span>
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${waterPct >= 100 ? 'bg-green-500' : waterPct >= 60 ? 'bg-blue-500' : 'bg-blue-300'}`}
            style={{ width: `${waterPct}%` }}
          />
        </div>
      </div>

      {/* BMI */}
      <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">BMI</span>
          <div className="flex items-center gap-2">
            <span className={`font-bold text-lg ${bmiCategory.color}`}>{bmi}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 ${bmiCategory.color}`}>
              {bmiCategory.label}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {currentWeight.toFixed(1)}kg · {data.userProfile.height}cm
        </div>
      </div>

      {/* Favorites Panel */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <FavoritesPanel />
      </div>
    </div>
  );
}
