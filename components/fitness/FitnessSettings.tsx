'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { Settings, Save, Target, Calculator } from 'lucide-react';
import type { ActivityLevel, Gender, GoalConfig } from '@/lib/types';
import { calculateTDEE, intakeFromGoal, computeRateFromTarget } from '@/lib/utils/tdee';

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
  const [profile, setProfile] = useState<{
    height: number;
    age: number;
    gender: Gender;
    activityLevel: ActivityLevel;
    dailyCalorieGoal: number;
    defaultWorkoutCalories: number;
    goal: GoalConfig;
    macroGoals: {
      protein: number;
      carbs: number;
      fat: number;
    };
  }>({
    height: 183,
    age: 27,
    gender: 'male',
    activityLevel: 'very_active',
    dailyCalorieGoal: 2400,
    defaultWorkoutCalories: 1100,
    goal: {
      mode: 'maintain',
      rateKgPerWeek: 0.5,
      targetWeightKg: undefined,
      targetDate: undefined,
      preferRate: true,
    },
    macroGoals: {
      protein: 200,
      carbs: 0,
      fat: 0,
    },
  });

  useEffect(() => {
    if (data) {
      const currentWeight = data.weightEntries.length > 0
        ? data.weightEntries[data.weightEntries.length - 1].weight
        : undefined;

      const goalConfig: GoalConfig = data.userProfile.goal
        ? { ...data.userProfile.goal }
        : {
            mode: 'maintain',
            rateKgPerWeek: 0.5,
            targetWeightKg: currentWeight,
            targetDate: undefined,
            preferRate: true,
          };

      setProfile({
        height: data.userProfile.height,
        age: data.userProfile.age,
        gender: data.userProfile.gender,
        activityLevel: data.userProfile.activityLevel,
        dailyCalorieGoal: data.userProfile.dailyCalorieGoal || (data.userProfile.baseTDEE || 3400) - 1000,
        defaultWorkoutCalories: data.userProfile.defaultWorkoutCalories || 1100,
        goal: goalConfig,
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
    
    const currentWeight = data.weightEntries.length > 0
      ? data.weightEntries[data.weightEntries.length - 1].weight
      : undefined;
    
    const tdee = currentWeight ? calculateTDEE(
      currentWeight,
      profile.height,
      profile.age,
      profile.gender,
      profile.activityLevel
    ) : data.userProfile.baseTDEE || 3400;
    
    let finalCalorieGoal = profile.dailyCalorieGoal;
    
    if (profile.goal && profile.goal.mode !== 'maintain' && currentWeight) {
      const calculatedGoal = intakeFromGoal(tdee, profile.goal, currentWeight);
      if (Math.abs(profile.dailyCalorieGoal - calculatedGoal) < 50) {
        finalCalorieGoal = calculatedGoal;
      }
    }
    
    updateUserProfile({
      ...profile,
      dailyCalorieGoal: finalCalorieGoal,
    });
    
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

        {/* Goal Configuration */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-blue-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Weight Goal</h3>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Goal Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['lose', 'maintain', 'gain'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setProfile({ 
                    ...profile, 
                    goal: { ...profile.goal, mode } 
                  })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    profile.goal.mode === mode
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {profile.goal.mode !== 'maintain' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setProfile({ 
                      ...profile, 
                      goal: { ...profile.goal, preferRate: true } 
                    })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      profile.goal.preferRate
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Rate (kg/week)
                  </button>
                  <button
                    onClick={() => setProfile({ 
                      ...profile, 
                      goal: { ...profile.goal, preferRate: false } 
                    })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !profile.goal.preferRate
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Target Weight
                  </button>
                </div>
              </div>

              {profile.goal.preferRate ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {profile.goal.mode === 'lose' ? 'Weight Loss Rate' : 'Weight Gain Rate'} (kg/week)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={profile.goal.mode === 'lose' ? '2' : '1'}
                    value={profile.goal.rateKgPerWeek || 0.5}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      goal: { ...profile.goal, rateKgPerWeek: parseFloat(e.target.value) || 0.5 } 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Recommended: {profile.goal.mode === 'lose' ? '0.5-1.0 kg/week' : '0.25-0.5 kg/week'}
                  </div>
                </div>
              ) : (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={profile.goal.targetWeightKg || ''}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        goal: { ...profile.goal, targetWeightKg: parseFloat(e.target.value) || undefined } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={profile.goal.targetDate || ''}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        goal: { ...profile.goal, targetDate: e.target.value || undefined } 
                      })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {(() => {
            const currentWeight = data.weightEntries.length > 0
              ? data.weightEntries[data.weightEntries.length - 1].weight
              : undefined;
            const tdee = currentWeight ? calculateTDEE(
              currentWeight,
              profile.height,
              profile.age,
              profile.gender,
              profile.activityLevel
            ) : data.userProfile.baseTDEE || 3400;
            
            const calculatedGoal = profile.goal.mode !== 'maintain' && currentWeight
              ? intakeFromGoal(tdee, profile.goal, currentWeight)
              : tdee;
            
            const computedRate = profile.goal.targetWeightKg && profile.goal.targetDate && currentWeight
              ? computeRateFromTarget(currentWeight, profile.goal.targetWeightKg, profile.goal.targetDate)
              : null;
            
            return (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="text-blue-600 dark:text-blue-400" size={18} />
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">Calculated Calorie Goal</h4>
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                  {calculatedGoal} cal/day
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Based on TDEE: {tdee} cal/day
                  {profile.goal.mode === 'lose' && calculatedGoal < tdee && (
                    <span className="ml-2">({(tdee - calculatedGoal).toFixed(0)} cal deficit/day)</span>
                  )}
                  {profile.goal.mode === 'gain' && calculatedGoal > tdee && (
                    <span className="ml-2">({(calculatedGoal - tdee).toFixed(0)} cal surplus/day)</span>
                  )}
                  {computedRate !== null && (
                    <div className="mt-1 text-xs">
                      Computed rate: {Math.abs(computedRate).toFixed(2)} kg/week
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <label className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <input
                      type="checkbox"
                      checked={profile.dailyCalorieGoal === calculatedGoal}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfile({ ...profile, dailyCalorieGoal: calculatedGoal });
                        }
                      }}
                      className="rounded"
                    />
                    Use calculated goal as daily calorie target
              </label>
              <input
                type="number"
                value={profile.dailyCalorieGoal}
                onChange={(e) => setProfile({ ...profile, dailyCalorieGoal: parseFloat(e.target.value) || 0 })}
                    className="mt-2 w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    placeholder="Or set manual calorie goal"
              />
                </div>
              </div>
            );
          })()}
            </div>

        {/* Other Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Other Settings</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
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

