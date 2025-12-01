'use client';

import { useState, useMemo } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { getDailyIntakes, getIntakeHistory } from '@/lib/utils/intake-analytics';
import { format } from 'date-fns';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function IntakeHistory() {
  const { data } = useFitness();
  const [windowDays, setWindowDays] = useState<30 | 60 | 90>(30);

  const dailyIntakes = useMemo(() => {
    if (!data) return [];
    return getDailyIntakes(data.foodEntries);
  }, [data?.foodEntries]);

  const history = useMemo(() => {
    if (!dailyIntakes.length) return [];
    return getIntakeHistory(dailyIntakes, windowDays);
  }, [dailyIntakes, windowDays]);

  const targetCalories = data?.userProfile?.dailyCalorieGoal;

  if (!data) return null;

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Intake History</h2>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No intake data available. Start logging food to see your history.</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: history.map((day) => format(new Date(day.date), 'MMM d')),
    datasets: [
      {
        label: 'Calories',
        data: history.map((day) => day.calories),
        backgroundColor: history.map((day) => 
          targetCalories && targetCalories > 0
            ? day.calories <= targetCalories + 100 && day.calories >= targetCalories - 100
              ? 'rgba(34, 197, 94, 0.6)'
              : day.calories > targetCalories
              ? 'rgba(239, 68, 68, 0.6)'
              : 'rgba(59, 130, 246, 0.6)'
            : 'rgba(59, 130, 246, 0.6)'
        ),
        borderColor: history.map((day) => 
          targetCalories && targetCalories > 0
            ? day.calories <= targetCalories + 100 && day.calories >= targetCalories - 100
              ? 'rgba(34, 197, 94, 1)'
              : day.calories > targetCalories
              ? 'rgba(239, 68, 68, 1)'
              : 'rgba(59, 130, 246, 1)'
            : 'rgba(59, 130, 246, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          afterLabel: (context: any) => {
            const index = context.dataIndex;
            const day = history[index];
            return [
              `Protein: ${day.protein.toFixed(1)}g`,
              `Carbs: ${day.carbs.toFixed(1)}g`,
              `Fat: ${day.fat.toFixed(1)}g`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Calories',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Daily Intake History</h2>
        <div className="flex gap-2">
          {([30, 60, 90] as const).map((days) => (
            <button
              key={days}
              onClick={() => setWindowDays(days)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                windowDays === days
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 mb-6">
        <Bar data={chartData} options={chartOptions} />
      </div>

      {targetCalories && targetCalories > 0 && (
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Under target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>On target (±100 cal)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Over target</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Date</th>
              <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Calories</th>
              <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Protein</th>
              <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Carbs</th>
              <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Fat</th>
              {targetCalories && targetCalories > 0 && (
                <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">vs Goal</th>
              )}
            </tr>
          </thead>
          <tbody>
            {history.slice().reverse().map((day, index) => {
              const diff = targetCalories && targetCalories > 0 
                ? day.calories - targetCalories 
                : null;
              
              return (
                <tr 
                  key={index} 
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                    {format(new Date(day.date), 'MMM d, yyyy')}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-gray-900 dark:text-gray-100">
                    {day.calories}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                    {day.protein.toFixed(1)}g
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                    {day.carbs.toFixed(1)}g
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                    {day.fat.toFixed(1)}g
                  </td>
                  {diff !== null && (
                    <td className={`py-2 px-3 text-right font-medium ${
                      Math.abs(diff) <= 100 
                        ? 'text-green-600 dark:text-green-400'
                        : diff > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

