export type TaskStatus = string; // Dynamic based on custom columns
export type Priority = 'high' | 'medium' | 'low';
export type SortOption = 'dueDate' | 'priority' | 'alphabetical' | 'createdAt' | 'timeTracked';
export type SortDirection = 'asc' | 'desc';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  color?: string;
  tags: string[];
  subtasks: Subtask[];
  attachments: Attachment[];
  timeTracked: number; // in seconds
  timeEntries: TimeEntry[];
  activityLog: ActivityEntry[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  type: 'url' | 'file';
  name: string;
  url: string;
  addedAt: string;
}

export interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
}

export interface ActivityEntry {
  id: string;
  action: 'created' | 'moved' | 'edited' | 'completed' | 'archived' | 'restored' | 'priority_changed' | 'tag_added' | 'time_logged';
  timestamp: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
}

export interface Column {
  id: string;
  name: string;
  color?: string;
  order: number;
  createdAt: string;
}

export interface KanbanData {
  tasks: Task[];
  columns: Column[];
  settings: {
    theme: 'light' | 'dark' | 'system';
    autoArchiveDays: number;
    defaultPriority: Priority;
    sortPreferences: Record<string, { option: SortOption; direction: SortDirection }>;
  };
}

export interface FilterOptions {
  search?: string;
  priority?: Priority[];
  status?: TaskStatus[];
  tags?: string[];
  dueDateRange?: {
    from?: string;
    to?: string;
  };
  hasAttachments?: boolean;
  hasSubtasks?: boolean;
}

// Fitness Types
export interface Macros {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export interface WeightEntry {
  id: string;
  date: string; // ISO date string
  weight: number; // kg
  notes?: string;
  timestamp: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  id: string;
  name: string;
  mealType: MealType;
  quantity: number;
  unit: string; // e.g., "g", "oz", "cup", "piece"
  macros: Macros;
  timestamp: string;
}

export interface FavoriteFood {
  id: string;
  name: string;
  baseQuantity: number; // Default quantity (e.g., 100g)
  unit: string;
  macros: Macros; // Macros per baseQuantity
  createdAt: string;
}

export interface WorkoutEntry {
  id: string;
  type: string;
  duration: number; // minutes
  caloriesBurned: number;
  date: string; // ISO date string
  timestamp: string;
}

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  height: number; // cm
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  baseTDEE?: number; // calculated TDEE
  dailyCalorieGoal?: number;
  defaultWorkoutCalories?: number; // default daily workout calories
  macroGoals?: {
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
  };
}

export interface FitnessData {
  weightEntries: WeightEntry[];
  foodEntries: FoodEntry[];
  workoutEntries: WorkoutEntry[];
  favoriteFoods: FavoriteFood[];
  userProfile: UserProfile;
  settings: {
    defaultMealCalories?: Record<MealType, number>;
  };
}
