import mongoose, { Schema, Model } from 'mongoose';
import type { FitnessData, WeightEntry, FoodEntry, WorkoutEntry, FavoriteFood, UserProfile } from '@/lib/types';

// Single user identifier - can be changed later if needed
const USER_ID = 'default-user';

// Subdocument schemas
const MacrosSchema = new Schema({
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
}, { _id: false });

const WeightEntrySchema = new Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  weight: { type: Number, required: true },
  notes: String,
  timestamp: { type: String, required: true },
}, { _id: false });

const FoodEntrySchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mealType: { 
    type: String, 
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true 
  },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  macros: { type: MacrosSchema, required: true },
  timestamp: { type: String, required: true, index: true },
}, { _id: false });

const FavoriteFoodSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  baseQuantity: { type: Number, required: true },
  unit: { type: String, required: true },
  macros: { type: MacrosSchema, required: true },
  createdAt: { type: String, required: true },
}, { _id: false });

const WorkoutEntrySchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  duration: { type: Number, required: true },
  caloriesBurned: { type: Number, required: true },
  date: { type: String, required: true, index: true },
  timestamp: { type: String, required: true },
}, { _id: false });

const MacroGoalsSchema = new Schema({
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
}, { _id: false });

const GoalConfigSchema = new Schema({
  mode: {
    type: String,
    enum: ['lose', 'maintain', 'gain'],
    default: 'maintain'
  },
  rateKgPerWeek: Number,
  targetWeightKg: Number,
  targetDate: String,
  preferRate: { type: Boolean, default: true },
}, { _id: false });

const UserProfileSchema = new Schema({
  height: { type: Number, required: true, default: 183 },
  age: { type: Number, required: true, default: 27 },
  gender: { 
    type: String, 
    enum: ['male', 'female'], 
    required: true,
    default: 'male' 
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    required: true,
    default: 'very_active'
  },
  baseTDEE: Number,
  dailyCalorieGoal: Number,
  defaultWorkoutCalories: Number,
  goal: GoalConfigSchema,
  macroGoals: MacroGoalsSchema,
}, { _id: false });

const SettingsSchema = new Schema({
  defaultMealCalories: {
    breakfast: Number,
    lunch: Number,
    dinner: Number,
    snack: Number,
  },
}, { _id: false });

// Main FitnessData schema
const FitnessDataSchema = new Schema({
  userId: { 
    type: String, 
    required: true, 
    default: USER_ID,
    index: true 
  },
  weightEntries: [WeightEntrySchema],
  foodEntries: [FoodEntrySchema],
  workoutEntries: [WorkoutEntrySchema],
  favoriteFoods: [FavoriteFoodSchema],
  userProfile: { type: UserProfileSchema, required: true },
  settings: { type: SettingsSchema, default: {} },
  lastModified: { type: Date, default: Date.now, index: true },
}, {
  timestamps: true,
});

// Indexes for faster queries
FitnessDataSchema.index({ userId: 1, lastModified: -1 });
FitnessDataSchema.index({ userId: 1, 'foodEntries.timestamp': -1 });
FitnessDataSchema.index({ userId: 1, 'workoutEntries.date': -1 });

export interface FitnessDataDocument extends Omit<FitnessData, 'userProfile' | 'settings'>, mongoose.Document {
  userId: string;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
  userProfile: UserProfile;
  settings: {
    defaultMealCalories?: Record<string, number>;
  };
}

const FitnessDataModel: Model<FitnessDataDocument> = 
  mongoose.models.FitnessData || mongoose.model<FitnessDataDocument>('FitnessData', FitnessDataSchema);

export default FitnessDataModel;

