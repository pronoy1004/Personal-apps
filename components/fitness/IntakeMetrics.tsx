'use client';

import { useMemo } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { getDailyIntakes, getIntakeMetrics, type IntakePeriod } from '@/lib/utils/intake-analytics';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

export default function IntakeMetrics() {
  const { data } = useFitness();

  if (!data) return null;

  const dailyIntakes = useMemo(() => getDailyIntakes(data.foodEntries), [data.foodEntries]);
  
  const targetCalories = data.userProfile.dailyCalorieGoal;
  
  const periods: IntakePeriod[] = [
    { period: '7d', days: 7 },
    { period: '14d', days: 14 },
    { period: '30d', days: 30 },
  ];

  const metrics = useMemo(() => {
    return periods.map((period) => ({
      period,
      metrics: getIntakeMetrics(dailyIntakes, period, targetCalories),
    }));
  }, [dailyIntakes, targetCalories]);

  const primaryMetrics = metrics.find(m => m.period.period === '30d') || metrics[metrics.length - 1];

  if (!primaryMetrics || primaryMetrics.metrics.daysWithData === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Intake Metrics</h2>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Start logging food to see your intake metrics and trends.</p>
        </div>
      </div>
    );
  }

  const { metrics: m } = primaryMetrics;
  const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus;
  const trendColor = m.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                     m.trend === 'down' ? 'text-blue-600 dark:text-blue-400' : 
                     'text-gray-600 dark:text-gray-400';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Intake Metrics</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">7-Day Avg</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {metrics.find(m => m.period.period === '7d')?.metrics.average || 0}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">cal/day</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">14-Day Avg</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {metrics.find(m => m.period.period === '14d')?.metrics.average || 0}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">cal/day</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-700 dark:text-green-300 mb-1">30-Day Avg</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {m.average}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">cal/day</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="text-sm text-orange-700 dark:text-orange-300 mb-1">Range</div>
          <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
            {m.min} - {m.max}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">cal/day</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Median</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{m.median} cal</div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Standard Deviation</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">±{m.variance} cal</div>
        </div>

        {targetCalories && targetCalories > 0 && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Compliance</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{m.compliance}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">Target: {targetCalories} cal</div>
          </div>
        )}

        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tracking Streak</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{m.streak} days</div>
          <div className="flex items-center gap-1 mt-1">
            <TrendIcon className={`${trendColor} w-4 h-4`} />
            <span className={`text-xs ${trendColor}`}>
              {m.trend === 'up' ? 'Increasing' : m.trend === 'down' ? 'Decreasing' : 'Stable'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Based on {m.daysWithData} days of data out of last {m.totalDays} days
        </div>
      </div>
    </div>
  );
}

