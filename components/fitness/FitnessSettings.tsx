'use client';

import { useState, useEffect } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { Settings, Save } from 'lucide-react';
import type { ActivityLevel, Gender } from '@/lib/types';

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary (little to no exercise)' },
  { value: 'light', label: 'Light (exercise 1-3 days/week)' },
  { value: 'moderate', label: 'Moderate (exercise 3-5 days/week)' },
  { value: 'active', label: 'Active (exercise 6-7 days/week)' },
  { value: 'very_active', label: 'Very Active (intense exercise daily)' },
];

export default function FitnessSettings() {
  const { data, updateUserProfile } = useFitness();
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    height: 183,
    age: 27,
    gender: 'male' as Gender,
    activityLevel: 'very_active' as ActivityLevel,
    dailyCalorieGoal: 2400,
    defaultWorkoutCalories: 1100,
    macroGoals: {
      protein: 200,
      carbs: 0,
      fat: 0,
    },
  });

  useEffect(() => {
    if (data) {
      setProfile({
        height: data.userProfile.height,
        age: data.userProfile.age,
        gender: data.userProfile.gender,
        activityLevel: data.userProfile.activityLevel,
        dailyCalorieGoal: data.userProfile.dailyCalorieGoal || (data.userProfile.baseTDEE || 3400) - 1000,
        defaultWorkoutCalories: data.userProfile.defaultWorkoutCalories || 1100,
        macroGoals: data.userProfile.macroGoals || {
          protein: 200,
          carbs: 0,
          fat: 0,
        },
      });
    }
  }, [data]);

  if (!data) return null;

  const handleSave = () => {
    setIsSaving(true);
    updateUserProfile(profile);
    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Fitness Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Personal Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                value={profile.height}
                onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Age
              </label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender
              </label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value as Gender })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Activity Level
              </label>
              <select
                value={profile.activityLevel}
                onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {ACTIVITY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Goals */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Goals</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Daily Calorie Goal
              </label>
              <input
                type="number"
                value={profile.dailyCalorieGoal}
                onChange={(e) => setProfile({ ...profile, dailyCalorieGoal: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Current TDEE: {data.userProfile.baseTDEE || 3400} cal
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Workout Calories
              </label>
              <input
                type="number"
                value={profile.defaultWorkoutCalories}
                onChange={(e) => setProfile({ ...profile, defaultWorkoutCalories: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Used when no workouts logged
              </div>
            </div>
          </div>

          {/* Macro Goals */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Daily Macro Goals (grams)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={profile.macroGoals.protein}
                  onChange={(e) => setProfile({
                    ...profile,
                    macroGoals: { ...profile.macroGoals, protein: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={profile.macroGoals.carbs}
                  onChange={(e) => setProfile({
                    ...profile,
                    macroGoals: { ...profile.macroGoals, carbs: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={profile.macroGoals.fat}
                  onChange={(e) => setProfile({
                    ...profile,
                    macroGoals: { ...profile.macroGoals, fat: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Set to 0 to disable tracking for that macro
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

