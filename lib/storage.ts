import { DEFAULT_COLUMNS, DEFAULT_SETTINGS } from './constants';
import type { KanbanData, Task, Column, FitnessData, UserProfile, FavoriteFood, FoodEntry } from './types';

const STORAGE_KEY = 'kanban-data';
const FITNESS_STORAGE_KEY = 'fitness-data';

export function loadKanbanData(): KanbanData {
  if (typeof window === 'undefined') {
    return {
      tasks: [],
      columns: DEFAULT_COLUMNS,
      settings: DEFAULT_SETTINGS,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        tasks: [],
        columns: DEFAULT_COLUMNS,
        settings: DEFAULT_SETTINGS,
      };
    }

    const data = JSON.parse(stored);
    
    // Ensure columns exist
    if (!data.columns || data.columns.length === 0) {
      data.columns = DEFAULT_COLUMNS;
    }
    
    // Ensure settings exist
    if (!data.settings) {
      data.settings = DEFAULT_SETTINGS;
    }

    return data as KanbanData;
  } catch (error) {
    console.error('Error loading kanban data:', error);
    return {
      tasks: [],
      columns: DEFAULT_COLUMNS,
      settings: DEFAULT_SETTINGS,
    };
  }
}

export function saveKanbanData(data: KanbanData): void {
  if (typeof window === 'undefined') return;

  try {
    // Ensure we're saving a fresh copy to avoid reference issues
    const dataToSave = JSON.parse(JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving kanban data:', error);
  }
}

export function exportData(data: KanbanData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): KanbanData | null {
  try {
    const data = JSON.parse(jsonString);
    return data as KanbanData;
  } catch (error) {
    console.error('Error importing data:', error);
    return null;
  }
}

// Fitness Data Storage
const DEFAULT_USER_PROFILE: UserProfile = {
  height: 183, // 6ft in cm
  age: 27,
  gender: 'male',
  activityLevel: 'very_active',
  baseTDEE: 3400,
  dailyCalorieGoal: 2400, // Assuming a 1000 cal deficit
  defaultWorkoutCalories: 1100,
  macroGoals: {
    protein: 200,
    carbs: 0,
    fat: 0,
  },
};

export function loadFitnessData(): FitnessData {
  if (typeof window === 'undefined') {
    return {
      weightEntries: [],
      foodEntries: [],
      workoutEntries: [],
      favoriteFoods: [],
      userProfile: DEFAULT_USER_PROFILE,
      settings: {},
    };
  }

  try {
    const stored = localStorage.getItem(FITNESS_STORAGE_KEY);
    if (!stored) {
      return {
        weightEntries: [],
        foodEntries: [],
        workoutEntries: [],
        favoriteFoods: [],
        userProfile: DEFAULT_USER_PROFILE,
        settings: {},
      };
    }

    const data = JSON.parse(stored) as FitnessData;
    
    // Ensure userProfile exists with defaults
    if (!data.userProfile) {
      data.userProfile = DEFAULT_USER_PROFILE;
    } else {
      // Merge with defaults to ensure all fields exist
      data.userProfile = { ...DEFAULT_USER_PROFILE, ...data.userProfile };
    }
    
    // Ensure arrays exist
    if (!data.weightEntries) data.weightEntries = [];
    if (!data.foodEntries) data.foodEntries = [];
    if (!data.workoutEntries) data.workoutEntries = [];
    if (!data.favoriteFoods) data.favoriteFoods = [];
    if (!data.settings) data.settings = {};

    // Migration: Convert old isFavorite entries to favoriteFoods
    if (data.foodEntries && data.foodEntries.length > 0) {
      const favoriteEntries = data.foodEntries.filter((entry: any) => entry.isFavorite);
      if (favoriteEntries.length > 0 && data.favoriteFoods.length === 0) {
        // Migrate old favorites to new structure
        data.favoriteFoods = favoriteEntries.map((entry: any) => {
          const favoriteFood: FavoriteFood = {
            id: `favorite-${entry.id}`,
            name: entry.name,
            baseQuantity: entry.quantity,
            unit: entry.unit,
            macros: entry.macros,
            createdAt: entry.timestamp || new Date().toISOString(),
          };
          return favoriteFood;
        });
        
        // Remove isFavorite from all entries
        data.foodEntries = data.foodEntries.map((entry: any) => {
          const { isFavorite, ...rest } = entry;
          return rest;
        });
        
        // Save migrated data
        saveFitnessData(data);
      } else if (data.foodEntries.some((entry: any) => entry.isFavorite)) {
        // Clean up any remaining isFavorite fields
        data.foodEntries = data.foodEntries.map((entry: any) => {
          const { isFavorite, ...rest } = entry;
          return rest;
        });
        saveFitnessData(data);
      }
    }

    return data;
  } catch (error) {
    console.error('Error loading fitness data:', error);
    return {
      weightEntries: [],
      foodEntries: [],
      workoutEntries: [],
      favoriteFoods: [],
      userProfile: DEFAULT_USER_PROFILE,
      settings: {},
    };
  }
}

export function saveFitnessData(data: FitnessData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(FITNESS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving fitness data:', error);
  }
}

export function exportFitnessData(data: FitnessData): string {
  return JSON.stringify(data, null, 2);
}

export function importFitnessData(jsonString: string): FitnessData | null {
  try {
    const data = JSON.parse(jsonString) as FitnessData;
    return data;
  } catch (error) {
    console.error('Error importing fitness data:', error);
    return null;
  }
}
