import { DEFAULT_COLUMNS, DEFAULT_SETTINGS } from './constants';
import type { KanbanData, Task, Column, FitnessData, UserProfile, FavoriteFood, FoodEntry } from './types';
import * as kanbanAPI from './api/kanban';
import * as fitnessAPI from './api/fitness';

const STORAGE_KEY = 'kanban-data';
const FITNESS_STORAGE_KEY = 'fitness-data';
const LAST_SYNC_KEY = 'last-sync';

// Check if online
function isOnline(): boolean {
  return typeof window !== 'undefined' && navigator.onLine;
}

// LocalStorage fallback functions
function getLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Sync to API in background (non-blocking)
async function syncToAPI(key: 'kanban' | 'fitness', data: KanbanData | FitnessData): Promise<string | null> {
  if (!isOnline()) return null;
  
  try {
    let result;
    if (key === 'kanban') {
      result = await kanbanAPI.saveKanbanData(data as KanbanData);
      setLocalStorage(`${LAST_SYNC_KEY}-kanban`, new Date().toISOString());
      if (result.lastModified) {
        setLocalStorage(`${LAST_SYNC_KEY}-kanban-lastModified`, result.lastModified);
      }
    } else {
      result = await fitnessAPI.saveFitnessData(data as FitnessData);
      setLocalStorage(`${LAST_SYNC_KEY}-fitness`, new Date().toISOString());
      if (result.lastModified) {
        setLocalStorage(`${LAST_SYNC_KEY}-fitness-lastModified`, result.lastModified);
      }
    }
    return result?.lastModified || null;
  } catch (error) {
    console.warn(`Failed to sync ${key} to API:`, error);
    return null;
  }
}

// Get last modified timestamp for sync checking
export function getLastSyncInfo(key: 'kanban' | 'fitness'): { lastSync: string | null; lastModified: string | null } {
  const syncKey = key === 'kanban' ? `${LAST_SYNC_KEY}-kanban` : `${LAST_SYNC_KEY}-fitness`;
  const modifiedKey = `${syncKey}-lastModified`;
  
  return {
    lastSync: getLocalStorage(syncKey),
    lastModified: getLocalStorage(modifiedKey),
  };
}

// Kanban Data Storage - Sync versions for backward compatibility
export function loadKanbanData(): KanbanData {
  const stored = getLocalStorage(STORAGE_KEY);
  if (!stored) {
    return {
      tasks: [],
      columns: DEFAULT_COLUMNS,
      settings: DEFAULT_SETTINGS,
    };
  }

  try {
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

// Async version for initial load - loads from localStorage only (sync happens on save)
export async function loadKanbanDataAsync(): Promise<KanbanData> {
  // Just load from localStorage - sync to API happens when data is saved
  return loadKanbanData();
}

export function saveKanbanData(data: KanbanData): void {
  // Always save to localStorage immediately (synchronous)
  try {
    const dataToSave = JSON.parse(JSON.stringify(data));
    setLocalStorage(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }

  // Sync to API in background (non-blocking)
  syncToAPI('kanban', data).catch(() => {
    // Already logged in syncToAPI
  });
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
  height: 183,
  age: 27,
  gender: 'male',
  activityLevel: 'very_active',
  baseTDEE: 3400,
  dailyCalorieGoal: 2400,
  defaultWorkoutCalories: 1100,
  macroGoals: {
    protein: 200,
    carbs: 0,
    fat: 0,
  },
};

export function loadFitnessData(): FitnessData {
  const stored = getLocalStorage(FITNESS_STORAGE_KEY);
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

  try {
    const data = JSON.parse(stored) as FitnessData;
    
    // Ensure userProfile exists with defaults
    if (!data.userProfile) {
      data.userProfile = DEFAULT_USER_PROFILE;
    } else {
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
        
        data.foodEntries = data.foodEntries.map((entry: any) => {
          const { isFavorite, ...rest } = entry;
          return rest;
        });
      } else if (data.foodEntries.some((entry: any) => entry.isFavorite)) {
        data.foodEntries = data.foodEntries.map((entry: any) => {
          const { isFavorite, ...rest } = entry;
          return rest;
        });
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

// Async version for initial load with API sync
export async function loadFitnessDataAsync(): Promise<FitnessData> {
  // Just load from localStorage - sync to API happens when data is saved
  return loadFitnessData();
}

export function saveFitnessData(data: FitnessData): void {
  // Always save to localStorage immediately (synchronous)
  try {
    setLocalStorage(FITNESS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }

  // Sync to API in background (non-blocking)
  syncToAPI('fitness', data).catch(() => {
    // Already logged in syncToAPI
  });
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
