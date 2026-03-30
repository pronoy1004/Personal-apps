'use client';

import { useMemo } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { BarChart3, TrendingDown, TrendingUp, Minus, Flame, Droplets, Dumbbell, UtensilsCrossed } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { calculateFoodLoggingStreak, calculateWorkoutStreak } from '@/lib/utils/streaks';

interface DayData {
  dateStr: string;
  label: string;
  calories: number;
  protein: number;
  workoutCalories: number;
  waterMl: number;
  logged: boolean;
  hasWorkout: boolean;
}

export default function WeeklyReport() {
  const { data } = useFitness();

  const weekData = useMemo<DayData[]>(() => {
    if (!data) return [];

    const days: DayData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const label = i === 0 ? 'Today' : format(date, 'EEE');

      const foodEntries = data.foodEntries.filter((e) => {
        const d = new Date(e.timestamp);
        return format(d, 'yyyy-MM-dd') === dateStr;
      });

      const workouts = data.workoutEntries.filter((e) => {
        const d = new Date(e.date);
        return format(d, 'yyyy-MM-dd') === dateStr;
      });

      const water = (data.waterEntries || []).filter((e) => {
        const d = new Date(e.timestamp);
        return format(d, 'yyyy-MM-dd') === dateStr;
      });

      const calories = foodEntries.reduce((s, e) => s + e.macros.calories, 0);
      const protein = foodEntries.reduce((s, e) => s + e.macros.protein, 0);
      const workoutCalories = workouts.reduce((s, e) => s + e.caloriesBurned, 0);
      const waterMl = water.reduce((s, e) => s + e.amount, 0);

      days.push({
        dateStr,
        label,
        calories,
        protein,
        workoutCalories,
        waterMl,
        logged: foodEntries.length > 0,
        hasWorkout: workouts.length > 0,
      });
    }
    return days;
  }, [data]);

  const foodStreak = data ? calculateFoodLoggingStreak(data.foodEntries) : 0;
  const workoutStreak = data ? calculateWorkoutStreak(data.workoutEntries) : 0;

  const summary = useMemo(() => {
    const loggedDays = weekData.filter((d) => d.logged);
    const workoutDays = weekData.filter((d) => d.hasWorkout);
    const avgCalories = loggedDays.length > 0
      ? Math.round(loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length)
      : 0;
    const avgProtein = loggedDays.length > 0
      ? Math.round(loggedDays.reduce((s, d) => s + d.protein, 0) / loggedDays.length)
      : 0;
    const totalWorkoutCalories = weekData.reduce((s, d) => s + d.workoutCalories, 0);
    const avgWater = weekData.some((d) => d.waterMl > 0)
      ? Math.round(weekData.reduce((s, d) => s + d.waterMl, 0) / 7)
      : 0;
    const goal = data?.userProfile.dailyCalorieGoal || 0;
    const daysOnTarget = goal > 0 ? loggedDays.filter((d) => d.calories <= goal * 1.05 && d.calories >= goal * 0.8).length : 0;

    return { loggedDays: loggedDays.length, workoutDays: workoutDays.length, avgCalories, avgProtein, totalWorkoutCalories, avgWater, daysOnTarget, goal };
  }, [weekData, data]);

  if (!data) return null;

  const maxCalories = Math.max(...weekData.map((d) => d.calories), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Weekly Report</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">Last 7 days</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-1.5 mb-1">
            <UtensilsCrossed size={14} className="text-blue-500" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Avg Calories</span>
          </div>
          <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{summary.avgCalories}</div>
          {summary.goal > 0 && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">goal: {summary.goal}</div>
          )}
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">Avg Protein</span>
          </div>
          <div className="text-xl font-bold text-red-900 dark:text-red-100">{summary.avgProtein}g</div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">{summary.loggedDays}/7 days logged</div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-1.5 mb-1">
            <Dumbbell size={14} className="text-purple-500" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Workouts</span>
          </div>
          <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{summary.workoutDays}</div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">{summary.totalWorkoutCalories} cal burned</div>
        </div>
        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-100 dark:border-cyan-800">
          <div className="flex items-center gap-1.5 mb-1">
            <Droplets size={14} className="text-cyan-500" />
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Avg Water</span>
          </div>
          <div className="text-xl font-bold text-cyan-900 dark:text-cyan-100">
            {summary.avgWater > 0 ? `${(summary.avgWater / 1000).toFixed(1)}L` : '—'}
          </div>
          {summary.daysOnTarget > 0 && (
            <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-0.5">{summary.daysOnTarget}d on target</div>
          )}
        </div>
      </div>

      {/* Streaks */}
      {(foodStreak > 0 || workoutStreak > 0) && (
        <div className="flex gap-3 mb-6">
          {foodStreak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
              <Flame className="text-orange-500" size={18} />
              <div>
                <div className="text-sm font-bold text-orange-700 dark:text-orange-300">{foodStreak} Day Streak</div>
                <div className="text-xs text-orange-600 dark:text-orange-400">Food logging</div>
              </div>
            </div>
          )}
          {workoutStreak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
              <Dumbbell className="text-purple-500" size={18} />
              <div>
                <div className="text-sm font-bold text-purple-700 dark:text-purple-300">{workoutStreak} Day Streak</div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Workout consistency</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7-Day Calorie Bar Chart */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Daily Calories</h3>
        <div className="flex items-end gap-2 h-32">
          {weekData.map((day) => {
            const heightPct = day.calories > 0 ? (day.calories / maxCalories) * 100 : 0;
            const isOverGoal = summary.goal > 0 && day.calories > summary.goal;
            const isOnTarget = summary.goal > 0 && day.calories >= summary.goal * 0.8 && day.calories <= summary.goal * 1.05;
            const barColor = !day.logged ? 'bg-gray-200 dark:bg-gray-700' :
                             isOverGoal ? 'bg-red-400' :
                             isOnTarget ? 'bg-green-400' : 'bg-blue-400';
            return (
              <div key={day.dateStr} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                  <div
                    className={`w-full rounded-t transition-all ${barColor}`}
                    style={{ height: `${Math.max(heightPct, day.logged ? 4 : 0)}%` }}
                    title={day.logged ? `${day.calories} cal` : 'No data'}
                  />
                </div>
                {/* Workout dot */}
                <div className={`w-2 h-2 rounded-full mt-1 ${day.hasWorkout ? 'bg-purple-500' : 'bg-transparent'}`} />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{day.label}</div>
                {day.logged && (
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{day.calories}</div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded inline-block" /> On target</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded inline-block" /> Over goal</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded inline-block" /> Under goal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full inline-block" /> Workout</span>
        </div>
      </div>

      {/* Weight change this week */}
      {data.weightEntries.length >= 2 && (() => {
        const sorted = [...data.weightEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const weekAgo = subDays(new Date(), 7);
        const recentEntries = sorted.filter((e) => new Date(e.date) >= weekAgo);
        if (recentEntries.length < 2) return null;
        const change = recentEntries[recentEntries.length - 1].weight - recentEntries[0].weight;
        return (
          <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Weight change (7d)</span>
              <div className="flex items-center gap-1.5">
                {change < 0 ? <TrendingDown className="text-green-500" size={18} /> :
                 change > 0 ? <TrendingUp className="text-red-500" size={18} /> :
                 <Minus className="text-gray-400" size={18} />}
                <span className={`font-bold ${change < 0 ? 'text-green-600 dark:text-green-400' : change > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(2)} kg
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
