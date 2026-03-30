'use client';

import { useState } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { Activity, Plus, X, Upload, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import type { ExerciseSet } from '@/lib/types';

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

const STRENGTH_WORKOUT_TYPES = new Set(['Weight Training', 'HIIT']);

export default function WorkoutLogger() {
  const { data, addWorkoutEntry, removeWorkoutEntry, getTodayWorkoutEntries } = useFitness();
  const [showForm, setShowForm] = useState(false);
  const [workoutType, setWorkoutType] = useState('Weight Training');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const todayDate = new Date().toISOString().split('T')[0];
  const [workoutDate, setWorkoutDate] = useState(() => todayDate);

  // Exercise sets state for strength training
  const [exercises, setExercises] = useState<ExerciseSet[]>([]);
  const [showExercises, setShowExercises] = useState(false);
  const [newExercise, setNewExercise] = useState({ exerciseName: '', sets: '3', reps: '10', weightKg: '' });
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  if (!data) return null;

  const todayWorkouts = getTodayWorkoutEntries();
  const defaultCalories = data.userProfile.defaultWorkoutCalories || 1100;

  const buildISOFromDateParts = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    if ([year, month, day].some((n) => Number.isNaN(n))) {
      return new Date().toISOString();
    }
    const localDate = new Date();
    localDate.setFullYear(year, month - 1, day);
    localDate.setHours(12, 0, 0, 0);
    return localDate.toISOString();
  };

  const resolveSelectedDateISO = (value?: string) => {
    const trimmed = value?.trim();
    if (trimmed) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return buildISOFromDateParts(trimmed);
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    return buildISOFromDateParts(workoutDate || todayDate);
  };

  const handleAddExercise = () => {
    if (!newExercise.exerciseName.trim()) return;
    const exercise: ExerciseSet = {
      exerciseName: newExercise.exerciseName.trim(),
      sets: parseInt(newExercise.sets) || 3,
      reps: parseInt(newExercise.reps) || 10,
      weightKg: newExercise.weightKg ? parseFloat(newExercise.weightKg) : undefined,
    };
    setExercises((prev) => [...prev, exercise]);
    setNewExercise({ exerciseName: '', sets: '3', reps: '10', weightKg: '' });
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!duration || !calories || isNaN(parseFloat(duration)) || isNaN(parseFloat(calories))) return;

    addWorkoutEntry({
      type: workoutType,
      duration: parseFloat(duration),
      caloriesBurned: parseFloat(calories),
      date: resolveSelectedDateISO(),
      exercises: exercises.length > 0 ? exercises : undefined,
      notes: workoutNotes || undefined,
    });

    setWorkoutType('Weight Training');
    setDuration('');
    setCalories('');
    setWorkoutNotes('');
    setExercises([]);
    setShowForm(false);
    setShowExercises(false);
  };

  const handleQuickAdd = () => {
    addWorkoutEntry({
      type: 'Daily Average',
      duration: 0,
      caloriesBurned: defaultCalories,
      date: resolveSelectedDateISO(),
    });
  };

  const handleImport = () => {
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
            if (Array.isArray(data)) {
              data.forEach((workout: any) => {
                if (workout.type && workout.caloriesBurned) {
                  addWorkoutEntry({
                    type: workout.type,
                    duration: workout.duration || 0,
                    caloriesBurned: workout.caloriesBurned,
                    date: workout.date ? resolveSelectedDateISO(workout.date) : resolveSelectedDateISO(),
                  });
                }
              });
            }
          } else if (file.name.endsWith('.csv')) {
            const lines = text.split('\n');
            lines.slice(1).forEach((line) => {
              const [type, duration, calories, date] = line.split(',');
              if (type && calories) {
                addWorkoutEntry({
                  type: type.trim(),
                  duration: parseFloat(duration) || 0,
                  caloriesBurned: parseFloat(calories),
                  date: date?.trim() ? resolveSelectedDateISO(date.trim()) : resolveSelectedDateISO(),
                });
              }
            });
          }
        } catch (error) {
          alert('Failed to import workout data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const totalCalories = todayWorkouts.reduce((sum, workout) => sum + workout.caloriesBurned, 0);
  const isStrengthWorkout = STRENGTH_WORKOUT_TYPES.has(workoutType);

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

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Workout Date
        </label>
        <input
          type="date"
          value={workoutDate}
          max={todayDate}
          onChange={(e) => setWorkoutDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          New workouts, quick adds, and imports without a date will use this selection.
        </p>
      </div>

      {!showForm && (
        <div className="mb-6">
          <button
            onClick={handleQuickAdd}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left"
          >
            <div className="font-medium">Quick Add: Daily Average</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {defaultCalories} calories (default workout)
            </div>
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Add Workout</h3>
            <button
              type="button"
              onClick={() => { setShowForm(false); setExercises([]); setShowExercises(false); }}
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
              onChange={(e) => { setWorkoutType(e.target.value); setExercises([]); setShowExercises(false); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {WORKOUT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (min)
              </label>
              <input
                type="number"
                step="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
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
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <input
              type="text"
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="How did it go?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Exercise sets for strength training */}
          {isStrengthWorkout && (
            <div>
              <button
                type="button"
                onClick={() => setShowExercises(!showExercises)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
              >
                <Dumbbell size={16} />
                {showExercises ? 'Hide' : 'Log'} Exercise Sets
                {exercises.length > 0 && (
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                    {exercises.length}
                  </span>
                )}
                {showExercises ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showExercises && (
                <div className="mt-3 space-y-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  {exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 font-medium text-gray-800 dark:text-gray-200">{ex.exerciseName}</span>
                      <span className="text-gray-500">
                        {ex.sets}×{ex.reps}{ex.weightKg ? ` @ ${ex.weightKg}kg` : ''}
                      </span>
                      <button type="button" onClick={() => handleRemoveExercise(i)} className="text-red-400 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <input
                      type="text"
                      value={newExercise.exerciseName}
                      onChange={(e) => setNewExercise({ ...newExercise, exerciseName: e.target.value })}
                      placeholder="Exercise name (e.g., Bench Press)"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-2"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExercise())}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={newExercise.sets}
                        onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                        placeholder="Sets"
                        min="1"
                        className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <input
                        type="number"
                        value={newExercise.reps}
                        onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                        placeholder="Reps"
                        min="1"
                        className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <input
                        type="number"
                        value={newExercise.weightKg}
                        onChange={(e) => setNewExercise({ ...newExercise, weightKg: e.target.value })}
                        placeholder="kg"
                        step="0.5"
                        className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddExercise}
                      className="mt-2 w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-medium transition-colors"
                    >
                      + Add Exercise
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Today&apos;s Workouts</h3>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Total: {totalCalories} cal
            </div>
          </div>
          <div className="space-y-2">
            {todayWorkouts.map((workout) => {
              const hasExercises = workout.exercises && workout.exercises.length > 0;
              return (
                <div key={workout.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{workout.type}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                        {workout.duration > 0 && <span>{workout.duration} min</span>}
                        {hasExercises && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Dumbbell size={12} /> {workout.exercises!.length} exercises
                          </span>
                        )}
                        {workout.notes && <span className="truncate italic text-xs">· {workout.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {workout.caloriesBurned} cal
                      </div>
                      {hasExercises && (
                        <button
                          onClick={() => setExpandedWorkoutId(expandedWorkoutId === workout.id ? null : workout.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          {expandedWorkoutId === workout.id
                            ? <ChevronUp size={16} className="text-gray-400" />
                            : <ChevronDown size={16} className="text-gray-400" />}
                        </button>
                      )}
                      <button
                        onClick={() => removeWorkoutEntry(workout.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      >
                        <X size={18} className="text-red-500" />
                      </button>
                    </div>
                  </div>

                  {expandedWorkoutId === workout.id && hasExercises && (
                    <div className="border-t border-gray-200 dark:border-gray-600 px-3 py-2 space-y-1.5">
                      {workout.exercises!.map((ex, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{ex.exerciseName}</span>
                          <span className="text-gray-500">
                            {ex.sets} × {ex.reps}{ex.weightKg ? ` @ ${ex.weightKg}kg` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
