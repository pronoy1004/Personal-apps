'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loadFitnessData, loadFitnessDataAsync, saveFitnessData } from '@/lib/storage';
import type { FitnessData, WeightEntry, FoodEntry, WorkoutEntry, UserProfile, FavoriteFood, MealType, WaterEntry, MealTemplate } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { calculateTDEE, intakeFromGoal } from '@/lib/utils/tdee';
import { format } from 'date-fns';
import { getStartOfDay, isSameDay, formatDay } from '@/lib/utils/date';

interface FitnessContextType {
  data: FitnessData | null;
  loading: boolean;
  addWeightEntry: (weight: number, notes?: string) => void;
  addFoodEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
  updateFoodEntry: (id: string, updates: Partial<FoodEntry>) => void;
  updateFoodEntryQuantity: (id: string, quantity: number, unit: string) => void;
  updateFoodEntryMeal: (id: string, newMealType: MealType) => void;
  removeFoodEntry: (id: string) => void;
  addWorkoutEntry: (entry: Omit<WorkoutEntry, 'id' | 'timestamp'>) => void;
  removeWorkoutEntry: (id: string) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  getTodayFoodEntries: () => FoodEntry[];
  getTodayWorkoutEntries: () => WorkoutEntry[];
  getCurrentWeight: () => number | null;
  addFavoriteFood: (food: Omit<FavoriteFood, 'id' | 'createdAt'>) => void;
  removeFavoriteFood: (id: string) => void;
  getFavoriteFoods: () => FavoriteFood[];
  // Settings
  updateSettings: (settings: Partial<FitnessData['settings']>) => void;
  // Water tracking
  addWaterEntry: (amount: number) => void;
  removeWaterEntry: (id: string) => void;
  getTodayWaterEntries: () => WaterEntry[];
  getTodayWaterTotal: () => number;
  // Meal templates
  saveMealTemplate: (name: string, foodEntryIds: string[]) => void;
  deleteMealTemplate: (id: string) => void;
  applyMealTemplate: (templateId: string, mealType: MealType) => void;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

export function FitnessProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FitnessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try async load first (with API sync), fallback to sync localStorage
    loadFitnessDataAsync()
      .then((fitnessData) => {
        setData(fitnessData);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to localStorage on error
        const fitnessData = loadFitnessData();
        setData(fitnessData);
        setLoading(false);
      });
  }, []);

  const updateData = useCallback((updater: (data: FitnessData) => FitnessData) => {
    setData((current) => {
      if (!current) return current;
      const updated = updater(current);
      // Save to localStorage
      saveFitnessData(updated);
      // Return new object to ensure React detects the change
      // Create a completely new object reference
      return {
        ...updated,
        foodEntries: [...updated.foodEntries],
        weightEntries: [...updated.weightEntries],
        workoutEntries: [...updated.workoutEntries],
        favoriteFoods: [...updated.favoriteFoods],
      };
    });
  }, []);

  const addWeightEntry = useCallback((weight: number, notes?: string) => {
    updateData((data) => {
      const today = formatDay(new Date());
      const existingIndex = data.weightEntries.findIndex(
        (entry) => formatDay(entry.date) === today
      );

      const newEntry: WeightEntry = {
        id: generateId(),
        date: new Date().toISOString(),
        weight,
        notes,
        timestamp: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        // Update existing entry for today
        data.weightEntries[existingIndex] = newEntry;
      } else {
        // Add new entry
        data.weightEntries.push(newEntry);
      }

      const profile = data.userProfile;
      const currentWeight = weight;
      const newTDEE = calculateTDEE(
        currentWeight,
        profile.height,
        profile.age,
        profile.gender,
        profile.activityLevel
      );
      
      data.userProfile.baseTDEE = newTDEE;
      
      if (profile.goal) {
        const goalIntake = intakeFromGoal(newTDEE, profile.goal, currentWeight);
        data.userProfile.dailyCalorieGoal = goalIntake;
      }

      return { ...data };
    });
  }, [updateData]);

  const addFoodEntry = useCallback((entry: Omit<FoodEntry, 'id' | 'timestamp'>) => {
    updateData((data) => {
      const newEntry: FoodEntry = {
        ...entry,
        id: generateId(),
        timestamp: new Date().toISOString(),
      };
      return {
        ...data,
        foodEntries: [...data.foodEntries, newEntry],
        weightEntries: [...data.weightEntries],
        workoutEntries: [...data.workoutEntries],
        favoriteFoods: [...data.favoriteFoods],
      };
    });
  }, [updateData]);

  const updateFoodEntry = useCallback((id: string, updates: Partial<FoodEntry>) => {
    updateData((data) => {
      return {
        ...data,
        foodEntries: data.foodEntries.map((entry) =>
          entry.id === id ? { ...entry, ...updates } : entry
        ),
      };
    });
  }, [updateData]);

  const updateFoodEntryQuantity = useCallback((id: string, quantity: number, unit: string) => {
    updateData((data) => {
      const entry = data.foodEntries.find((e) => e.id === id);
      if (!entry) return data;

      // Recalculate macros based on new quantity
      // Use entry's current quantity as the base for ratio calculation
      const ratio = quantity / entry.quantity;

      const updatedMacros = {
        calories: Math.round(entry.macros.calories * ratio),
        protein: Math.round((entry.macros.protein * ratio) * 10) / 10,
        carbs: Math.round((entry.macros.carbs * ratio) * 10) / 10,
        fat: Math.round((entry.macros.fat * ratio) * 10) / 10,
        ...(entry.macros.fiber != null && { fiber: Math.round(entry.macros.fiber * ratio * 10) / 10 }),
        ...(entry.macros.sugar != null && { sugar: Math.round(entry.macros.sugar * ratio * 10) / 10 }),
        ...(entry.macros.sodium != null && { sodium: Math.round(entry.macros.sodium * ratio) }),
      };

      return {
        ...data,
        foodEntries: data.foodEntries.map((e) =>
          e.id === id
            ? { ...e, quantity, unit, macros: updatedMacros }
            : e
        ),
      };
    });
  }, [updateData]);

  const updateFoodEntryMeal = useCallback((id: string, newMealType: MealType) => {
    updateData((data) => {
      return {
        ...data,
        foodEntries: data.foodEntries.map((entry) =>
          entry.id === id ? { ...entry, mealType: newMealType } : entry
        ),
      };
    });
  }, [updateData]);

  const removeFoodEntry = useCallback((id: string) => {
    updateData((data) => {
      data.foodEntries = data.foodEntries.filter((entry) => entry.id !== id);
      return { ...data };
    });
  }, [updateData]);

  const addFavoriteFood = useCallback((food: Omit<FavoriteFood, 'id' | 'createdAt'>) => {
    updateData((data) => {
      // Check if already exists (by name and baseQuantity)
      const exists = data.favoriteFoods.some(
        (f) => f.name === food.name && f.baseQuantity === food.baseQuantity && f.unit === food.unit
      );
      if (exists) return data;

      const newFavorite: FavoriteFood = {
        ...food,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      return {
        ...data,
        favoriteFoods: [...data.favoriteFoods, newFavorite],
      };
    });
  }, [updateData]);

  const removeFavoriteFood = useCallback((id: string) => {
    updateData((data) => {
      return {
        ...data,
        favoriteFoods: data.favoriteFoods.filter((f) => f.id !== id),
      };
    });
  }, [updateData]);

  const getFavoriteFoods = useCallback(() => {
    if (!data) return [];
    return data.favoriteFoods;
  }, [data]);

  const updateSettings = useCallback((settings: Partial<FitnessData['settings']>) => {
    updateData((data) => ({
      ...data,
      settings: { ...data.settings, ...settings },
    }));
  }, [updateData]);

  // Water tracking
  const addWaterEntry = useCallback((amount: number) => {
    updateData((data) => {
      const newEntry: WaterEntry = {
        id: generateId(),
        amount,
        timestamp: new Date().toISOString(),
      };
      return {
        ...data,
        waterEntries: [...(data.waterEntries || []), newEntry],
      };
    });
  }, [updateData]);

  const removeWaterEntry = useCallback((id: string) => {
    updateData((data) => ({
      ...data,
      waterEntries: (data.waterEntries || []).filter((e) => e.id !== id),
    }));
  }, [updateData]);

  const getTodayWaterEntries = useCallback(() => {
    if (!data) return [];
    const today = getStartOfDay(new Date());
    return (data.waterEntries || []).filter((e) => isSameDay(e.timestamp, today));
  }, [data]);

  const getTodayWaterTotal = useCallback(() => {
    if (!data) return 0;
    const today = getStartOfDay(new Date());
    return (data.waterEntries || [])
      .filter((e) => isSameDay(e.timestamp, today))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [data]);

  // Meal templates
  const saveMealTemplate = useCallback((name: string, foodEntryIds: string[]) => {
    updateData((data) => {
      const today = getStartOfDay(new Date());
      const todayEntries = data.foodEntries.filter((e) => isSameDay(e.timestamp, today));
      const selectedEntries = todayEntries.filter((e) => foodEntryIds.includes(e.id));

      if (selectedEntries.length === 0) return data;

      const template: MealTemplate = {
        id: generateId(),
        name,
        foods: selectedEntries.map((e) => ({
          name: e.name,
          quantity: e.quantity,
          unit: e.unit,
          macros: e.macros,
        })),
        createdAt: new Date().toISOString(),
      };

      return {
        ...data,
        mealTemplates: [...(data.mealTemplates || []), template],
      };
    });
  }, [updateData]);

  const deleteMealTemplate = useCallback((id: string) => {
    updateData((data) => ({
      ...data,
      mealTemplates: (data.mealTemplates || []).filter((t) => t.id !== id),
    }));
  }, [updateData]);

  const applyMealTemplate = useCallback((templateId: string, mealType: MealType) => {
    updateData((data) => {
      const template = (data.mealTemplates || []).find((t) => t.id === templateId);
      if (!template) return data;

      const newEntries = template.foods.map((food) => ({
        id: generateId(),
        name: food.name,
        mealType,
        quantity: food.quantity,
        unit: food.unit,
        macros: food.macros,
        timestamp: new Date().toISOString(),
      }));

      return {
        ...data,
        foodEntries: [...data.foodEntries, ...newEntries],
      };
    });
  }, [updateData]);

  const addWorkoutEntry = useCallback((entry: Omit<WorkoutEntry, 'id' | 'timestamp'>) => {
    updateData((data) => {
      const newEntry: WorkoutEntry = {
        ...entry,
        id: generateId(),
        timestamp: new Date().toISOString(),
      };
      data.workoutEntries.push(newEntry);
      return { ...data };
    });
  }, [updateData]);

  const removeWorkoutEntry = useCallback((id: string) => {
    updateData((data) => {
      data.workoutEntries = data.workoutEntries.filter((entry) => entry.id !== id);
      return { ...data };
    });
  }, [updateData]);

  const updateUserProfile = useCallback((profile: Partial<UserProfile>) => {
    updateData((data) => {
      const updatedProfile = { ...data.userProfile, ...profile };
      
      const getEstimatedWeight = (height: number, gender: string): number => {
        const heightM = height / 100;
        const bmiTarget = gender === 'male' ? 22 : 21;
        return Math.round(heightM * heightM * bmiTarget);
      };

      const currentWeight = data.weightEntries.length > 0
        ? data.weightEntries[data.weightEntries.length - 1].weight
        : getEstimatedWeight(updatedProfile.height, updatedProfile.gender);
      
      const newTDEE = calculateTDEE(
        currentWeight,
        updatedProfile.height,
        updatedProfile.age,
        updatedProfile.gender,
        updatedProfile.activityLevel,
        updatedProfile.defaultWorkoutCalories || 0
      );
      
      updatedProfile.baseTDEE = newTDEE;
      
      if (updatedProfile.goal) {
        const goalIntake = intakeFromGoal(newTDEE, updatedProfile.goal, currentWeight);
        updatedProfile.dailyCalorieGoal = goalIntake;
      }

      data.userProfile = updatedProfile;
      return { ...data };
    });
  }, [updateData]);

  const getTodayFoodEntries = useCallback(() => {
    if (!data) return [];
    const today = getStartOfDay(new Date());
    return data.foodEntries.filter((entry) =>
      isSameDay(entry.timestamp, today)
    );
  }, [data]);

  const getTodayWorkoutEntries = useCallback(() => {
    if (!data) return [];
    const today = getStartOfDay(new Date());
    return data.workoutEntries.filter((entry) =>
      isSameDay(entry.date, today)
    );
  }, [data]);

  const getCurrentWeight = useCallback(() => {
    if (!data || data.weightEntries.length === 0) return null;
    return data.weightEntries[data.weightEntries.length - 1].weight;
  }, [data]);

  const value: FitnessContextType = {
    data,
    loading,
    addWeightEntry,
    addFoodEntry,
    updateFoodEntry,
    updateFoodEntryQuantity,
    updateFoodEntryMeal,
    removeFoodEntry,
    addWorkoutEntry,
    removeWorkoutEntry,
    updateUserProfile,
    getTodayFoodEntries,
    getTodayWorkoutEntries,
    getCurrentWeight,
    addFavoriteFood,
    removeFavoriteFood,
    getFavoriteFoods,
    updateSettings,
    addWaterEntry,
    removeWaterEntry,
    getTodayWaterEntries,
    getTodayWaterTotal,
    saveMealTemplate,
    deleteMealTemplate,
    applyMealTemplate,
  };

  return <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>;
}

export function useFitness() {
  const context = useContext(FitnessContext);
  if (context === undefined) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
}

