'use client';

import { useState, useMemo, Fragment } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { getDailyWorkouts, getWorkoutHistory } from '@/lib/utils/workout-analytics';
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
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function WorkoutHistory() {
  const { data } = useFitness();
  const [windowDays, setWindowDays] = useState<30 | 60 | 90>(30);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const dailyWorkouts = useMemo(() => {
    if (!data) return [];
    return getDailyWorkouts(data.workoutEntries);
  }, [data]);

  const history = useMemo(() => {
    if (!dailyWorkouts.length) return [];
    return getWorkoutHistory(dailyWorkouts, windowDays);
  }, [dailyWorkouts, windowDays]);

  if (!data) return null;

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Workout History</h2>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No workout data available. Start logging workouts to see your history.</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: history.map((day) => format(new Date(day.date), 'MMM d')),
    datasets: [
      {
        label: 'Calories Burned',
        data: history.map((day) => day.caloriesBurned),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
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
            const parts = [];
            if (day.totalDuration > 0) {
              parts.push(`Duration: ${day.totalDuration} min`);
            }
            parts.push(`Workouts: ${day.workoutCount}`);
            return parts;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Calories Burned',
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
        <div className="flex items-center gap-3">
          <Activity className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Workout History</h2>
        </div>
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Date</th>
              <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Calories</th>
              <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Duration</th>
              <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Workouts</th>
              <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Types</th>
            </tr>
          </thead>
          <tbody>
            {history.slice().reverse().map((day, index) => {
              const isExpanded = expandedDay === day.date;
              const hasExercises = day.workouts.some((w) => w.exercises && w.exercises.length > 0);
              return (
                <Fragment key={day.date}>
                  <tr
                    onClick={() => hasExercises && setExpandedDay(isExpanded ? null : day.date)}
                    className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${hasExercises ? 'cursor-pointer' : ''}`}
                  >
                    <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-1">
                        {format(new Date(day.date), 'MMM d, yyyy')}
                        {hasExercises && (
                          isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {day.caloriesBurned} cal
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                      {day.totalDuration > 0 ? `${day.totalDuration} min` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                      {day.workoutCount}
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {day.workouts.map((workout) => (
                          <span
                            key={workout.id}
                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                          >
                            {workout.type}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && day.workouts.map((workout) =>
                    workout.exercises && workout.exercises.length > 0 ? (
                      <tr key={`${workout.id}-exercises`} className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-700/30">
                        <td colSpan={5} className="py-2 px-6">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{workout.type} — Exercises</div>
                          <div className="flex flex-wrap gap-2">
                            {workout.exercises.map((ex, i) => (
                              <span key={i} className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded">
                                {ex.exerciseName}: {ex.sets}×{ex.reps}{ex.weightKg ? ` @ ${ex.weightKg}kg` : ''}
                              </span>
                            ))}
                          </div>
                          {workout.notes && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">{workout.notes}</div>
                          )}
                        </td>
                      </tr>
                    ) : null
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
