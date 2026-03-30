import { DEFAULT_COLUMNS, DEFAULT_SETTINGS } from './constants';
import type { KanbanData, Task, Column, FitnessData, UserProfile, FavoriteFood, FoodEntry, ApiKeysData, MoviesData } from './types';
import * as kanbanAPI from './api/kanban';
import * as fitnessAPI from './api/fitness';
import * as apiKeysAPI from './api/api-keys';
import * as moviesAPI from './api/movies-client';

const STORAGE_KEY = 'kanban-data';
const FITNESS_STORAGE_KEY = 'fitness-data';
const API_KEYS_STORAGE_KEY = 'api-keys-data';
const MOVIES_STORAGE_KEY = 'movies-data';
const LAST_SYNC_KEY = 'last-sync';
const DEFAULT_API_KEYS_DATA: ApiKeysData = {
  passcodeHash: undefined,
  passcodeSalt: undefined,
  keys: [],
  lastModified: new Date().toISOString(),
};


function isOnline(): boolean {
  return typeof window !== 'undefined' && navigator.onLine;
}

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

async function syncToAPI(key: 'kanban' | 'fitness' | 'movies', data: KanbanData | FitnessData | MoviesData): Promise<string | null> {
  if (!isOnline()) return null;
  
  try {
    let result;
    if (key === 'kanban') {
      result = await kanbanAPI.saveKanbanData(data as KanbanData);
      setLocalStorage(`${LAST_SYNC_KEY}-kanban`, new Date().toISOString());
      if (result.lastModified) {
        setLocalStorage(`${LAST_SYNC_KEY}-kanban-lastModified`, result.lastModified);
      }
    } else if (key === 'fitness') {
      result = await fitnessAPI.saveFitnessData(data as FitnessData);
      setLocalStorage(`${LAST_SYNC_KEY}-fitness`, new Date().toISOString());
      if (result.lastModified) {
        setLocalStorage(`${LAST_SYNC_KEY}-fitness-lastModified`, result.lastModified);
      }
    } else {
      result = await moviesAPI.saveMoviesData(data as MoviesData);
      setLocalStorage(`${LAST_SYNC_KEY}-movies`, new Date().toISOString());
      if (result.lastModified) {
        setLocalStorage(`${LAST_SYNC_KEY}-movies-lastModified`, result.lastModified);
      }
    }
    return result?.lastModified || null;
  } catch (error) {
    console.warn(`Failed to sync ${key} to API:`, error);
    return null;
  }
}

export function getLastSyncInfo(key: 'kanban' | 'fitness'): { lastSync: string | null; lastModified: string | null } {
  const syncKey = key === 'kanban' ? `${LAST_SYNC_KEY}-kanban` : `${LAST_SYNC_KEY}-fitness`;
  const modifiedKey = `${syncKey}-lastModified`;
  
  return {
    lastSync: getLocalStorage(syncKey),
    lastModified: getLocalStorage(modifiedKey),
  };
}

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
    
    if (!data.columns || data.columns.length === 0) {
      data.columns = DEFAULT_COLUMNS;
    }
    
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

export async function loadKanbanDataAsync(): Promise<KanbanData> {
  if (!isOnline()) {
    return loadKanbanData();
  }

  try {
    const dbData = await kanbanAPI.fetchKanbanData();
    const kanbanData: KanbanData = {
      tasks: dbData.tasks || [],
      columns: dbData.columns || DEFAULT_COLUMNS,
      settings: dbData.settings || DEFAULT_SETTINGS,
    };

    if (!kanbanData.columns || kanbanData.columns.length === 0) {
      kanbanData.columns = DEFAULT_COLUMNS;
    }
    if (!kanbanData.settings) {
      kanbanData.settings = DEFAULT_SETTINGS;
    }

    setLocalStorage(STORAGE_KEY, JSON.stringify(kanbanData));
    if (dbData.lastModified) {
      setLocalStorage(`${LAST_SYNC_KEY}-kanban-lastModified`, dbData.lastModified);
    }

    return kanbanData;
  } catch (error) {
    return loadKanbanData();
  }
}

export function saveKanbanData(data: KanbanData): void {
  try {
    const dataToSave = JSON.parse(JSON.stringify(data));
    setLocalStorage(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }

  syncToAPI('kanban', data).catch(() => {});
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
      waterEntries: [],
      mealTemplates: [],
      userProfile: DEFAULT_USER_PROFILE,
      settings: {},
    };
  }

  try {
    const data = JSON.parse(stored) as FitnessData;
    
    if (!data.userProfile) {
      data.userProfile = DEFAULT_USER_PROFILE;
    } else {
      data.userProfile = { ...DEFAULT_USER_PROFILE, ...data.userProfile };
    }
    
    if (!data.weightEntries) data.weightEntries = [];
    if (!data.foodEntries) data.foodEntries = [];
    if (!data.workoutEntries) data.workoutEntries = [];
    if (!data.favoriteFoods) data.favoriteFoods = [];
    if (!data.waterEntries) data.waterEntries = [];
    if (!data.mealTemplates) data.mealTemplates = [];
    if (!data.settings) data.settings = {};
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
      waterEntries: [],
      mealTemplates: [],
      userProfile: DEFAULT_USER_PROFILE,
      settings: {},
    };
  }
}

export async function loadFitnessDataAsync(): Promise<FitnessData> {
  if (!isOnline()) {
    return loadFitnessData();
  }

  try {
    const dbData = await fitnessAPI.fetchFitnessData();
    const fitnessData: FitnessData = {
      weightEntries: dbData.weightEntries || [],
      foodEntries: dbData.foodEntries || [],
      workoutEntries: dbData.workoutEntries || [],
      favoriteFoods: dbData.favoriteFoods || [],
      waterEntries: (dbData as any).waterEntries || [],
      mealTemplates: (dbData as any).mealTemplates || [],
      userProfile: dbData.userProfile || DEFAULT_USER_PROFILE,
      settings: dbData.settings || {},
    };

    if (!fitnessData.userProfile) {
      fitnessData.userProfile = DEFAULT_USER_PROFILE;
    } else {
      fitnessData.userProfile = { ...DEFAULT_USER_PROFILE, ...fitnessData.userProfile };
    }

    setLocalStorage(FITNESS_STORAGE_KEY, JSON.stringify(fitnessData));
    if (dbData.lastModified) {
      setLocalStorage(`${LAST_SYNC_KEY}-fitness-lastModified`, dbData.lastModified);
    }

    return fitnessData;
  } catch (error) {
    return loadFitnessData();
  }
}

export function saveFitnessData(data: FitnessData): void {
  try {
    setLocalStorage(FITNESS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }

  syncToAPI('fitness', data).catch(() => {});
}

export function loadApiKeysData(): ApiKeysData {
  const stored = getLocalStorage(API_KEYS_STORAGE_KEY);
  if (!stored) {
    return { ...DEFAULT_API_KEYS_DATA };
  }

  try {
    const parsed = JSON.parse(stored) as ApiKeysData;
    return {
      passcodeHash: parsed.passcodeHash,
      passcodeSalt: parsed.passcodeSalt,
      keys: parsed.keys || [],
      lastModified: parsed.lastModified || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error parsing API keys data:', error);
    return { ...DEFAULT_API_KEYS_DATA };
  }
}

export async function loadApiKeysDataAsync(): Promise<ApiKeysData> {
  if (!isOnline()) {
    return loadApiKeysData();
  }

  try {
    const dbData = await apiKeysAPI.fetchApiKeysData();
    const data: ApiKeysData = {
      passcodeHash: dbData.passcodeHash,
      passcodeSalt: dbData.passcodeSalt,
      keys: dbData.keys || [],
      lastModified: dbData.lastModified || new Date().toISOString(),
    };
    setLocalStorage(API_KEYS_STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Failed to load API keys data from server:', error);
    return loadApiKeysData();
  }
}

export async function saveApiKeysData(data: ApiKeysData): Promise<void> {
  try {
    setLocalStorage(API_KEYS_STORAGE_KEY, JSON.stringify(data));
    await apiKeysAPI.saveApiKeysData(data);
  } catch (error) {
    console.error('Failed to save API keys data:', error);
    throw error;
  }
}

const DEFAULT_MOVIES_DATA: MoviesData = {
  mediaEntries: [],
  watchEntries: [],
  preferences: {
    genreWeights: {},
    preferredTypes: ['movie', 'tv'],
    lastRefined: new Date().toISOString(),
  },
  lastModified: new Date().toISOString(),
};

export function loadMoviesData(): MoviesData {
  const stored = getLocalStorage(MOVIES_STORAGE_KEY);
  if (!stored) {
    return { ...DEFAULT_MOVIES_DATA };
  }

  try {
    const data = JSON.parse(stored) as MoviesData;
    return {
      mediaEntries: data.mediaEntries || [],
      watchEntries: data.watchEntries || [],
      preferences: data.preferences || DEFAULT_MOVIES_DATA.preferences,
      lastModified: data.lastModified || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error loading movies data:', error);
    return { ...DEFAULT_MOVIES_DATA };
  }
}

export async function loadMoviesDataAsync(): Promise<MoviesData> {
  if (!isOnline()) {
    return loadMoviesData();
  }

  try {
    const dbData = await moviesAPI.fetchMoviesData();
    const moviesData: MoviesData = {
      mediaEntries: dbData.mediaEntries || [],
      watchEntries: dbData.watchEntries || [],
      preferences: dbData.preferences || DEFAULT_MOVIES_DATA.preferences,
      lastModified: dbData.lastModified || new Date().toISOString(),
    };

    if (!moviesData.preferences) {
      moviesData.preferences = DEFAULT_MOVIES_DATA.preferences;
    }

    setLocalStorage(MOVIES_STORAGE_KEY, JSON.stringify(moviesData));
    if (dbData.lastModified) {
      setLocalStorage(`${LAST_SYNC_KEY}-movies-lastModified`, dbData.lastModified);
    }

    return moviesData;
  } catch (error) {
    return loadMoviesData();
  }
}

export function saveMoviesData(data: MoviesData): void {
  try {
    setLocalStorage(MOVIES_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }

  syncToAPI('movies', data).catch(() => {});
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
