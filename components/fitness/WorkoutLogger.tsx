'use client';

import { useState } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { Activity, Plus, X, Upload } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { generateId } from '@/lib/utils';

const WORKOUT_TYPES = [
  'Running',
  'Cycling',
  'Weight Training',
  'Swimming',
  'Walking',
  'HIIT',
  'Yoga',
  'Other',
];

export default function WorkoutLogger() {
  const { data, addWorkoutEntry, removeWorkoutEntry, getTodayWorkoutEntries } = useFitness();
  const [showForm, setShowForm] = useState(false);
  const [workoutType, setWorkoutType] = useState('Weight Training');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [useDefault, setUseDefault] = useState(false);

  if (!data) return null;

  const todayWorkouts = getTodayWorkoutEntries();
  const defaultCalories = data.userProfile.defaultWorkoutCalories || 1100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (useDefault) {
      // Add default workout
      addWorkoutEntry({
        type: 'Daily Average',
        duration: 0,
        caloriesBurned: defaultCalories,
        date: new Date().toISOString(),
      });
    } else {
      if (!duration || !calories || isNaN(parseFloat(duration)) || isNaN(parseFloat(calories))) {
        return;
      }

      addWorkoutEntry({
        type: workoutType,
        duration: parseFloat(duration),
        caloriesBurned: parseFloat(calories),
        date: new Date().toISOString(),
      });
    }

    // Reset form
    setWorkoutType('Weight Training');
    setDuration('');
    setCalories('');
    setUseDefault(false);
    setShowForm(false);
  };

  const handleImport = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (file.name.endsWith('.json')) {
            const data = JSON.parse(text);
            // Handle JSON import (format depends on export from Apple Health)
            if (Array.isArray(data)) {
              data.forEach((workout: any) => {
                if (workout.type && workout.caloriesBurned) {
                  addWorkoutEntry({
                    type: workout.type,
                    duration: workout.duration || 0,
                    caloriesBurned: workout.caloriesBurned,
                    date: workout.date || new Date().toISOString(),
                  });
                }
              });
            }
          } else if (file.name.endsWith('.csv')) {
            // Handle CSV import
            const lines = text.split('\n');
            lines.slice(1).forEach((line) => {
              const [type, duration, calories, date] = line.split(',');
              if (type && calories) {
                addWorkoutEntry({
                  type: type.trim(),
                  duration: parseFloat(duration) || 0,
                  caloriesBurned: parseFloat(calories),
                  date: date ? date.trim() : new Date().toISOString(),
                });
              }
            });
          }
        } catch (error) {
          console.error('Error importing workout data:', error);
          alert('Failed to import workout data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const totalCalories = todayWorkouts.reduce((sum, workout) => sum + workout.caloriesBurned, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Workout Logger</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            title="Import from Apple Health export"
          >
            <Upload size={16} />
            Import
          </button>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add Workout
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Default */}
      {!showForm && (
        <div className="mb-6">
          <button
            onClick={() => {
              setUseDefault(true);
              handleSubmit(new Event('submit') as any);
            }}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left"
          >
            <div className="font-medium">Quick Add: Daily Average</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {defaultCalories} calories (default workout)
            </div>
          </button>
        </div>
      )}

      {/* Add Workout Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Add Workout</h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setWorkoutType('Weight Training');
                setDuration('');
                setCalories('');
                setUseDefault(false);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workout Type
            </label>
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {WORKOUT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                step="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required={!useDefault}
                disabled={useDefault}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Calories Burned
              </label>
              <input
                type="number"
                step="1"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required={!useDefault}
                disabled={useDefault}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Add Workout
          </button>
        </form>
      )}

      {/* Today's Workouts */}
      {todayWorkouts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Today's Workouts</h3>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Total: {totalCalories} cal
            </div>
          </div>
          <div className="space-y-2">
            {todayWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{workout.type}</div>
                  {workout.duration > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {workout.duration} minutes
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {workout.caloriesBurned} cal
                  </div>
                  <button
                    onClick={() => removeWorkoutEntry(workout.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  >
                    <X size={18} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

