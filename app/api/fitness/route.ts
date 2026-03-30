import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import FitnessDataModel from '@/lib/models/FitnessData';
import type { FitnessData } from '@/lib/types';

const USER_ID = 'default-user';

const DEFAULT_PROFILE = {
  height: 183,
  age: 27,
  gender: 'male',
  activityLevel: 'very_active',
  baseTDEE: 3400,
  dailyCalorieGoal: 2400,
  defaultWorkoutCalories: 1100,
  macroGoals: { protein: 200, carbs: 0, fat: 0 },
};

const EMPTY_DATA = {
  weightEntries: [],
  foodEntries: [],
  workoutEntries: [],
  favoriteFoods: [],
  waterEntries: [],
  mealTemplates: [],
  userProfile: DEFAULT_PROFILE,
  settings: {},
  lastModified: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json(EMPTY_DATA);
    }

    const fitnessData = await FitnessDataModel.findOne({ userId: USER_ID });

    if (!fitnessData) {
      return NextResponse.json(EMPTY_DATA);
    }

    const data = {
      weightEntries: fitnessData.weightEntries || [],
      foodEntries: fitnessData.foodEntries || [],
      workoutEntries: fitnessData.workoutEntries || [],
      favoriteFoods: fitnessData.favoriteFoods || [],
      waterEntries: (fitnessData as any).waterEntries || [],
      mealTemplates: (fitnessData as any).mealTemplates || [],
      userProfile: fitnessData.userProfile || DEFAULT_PROFILE,
      settings: fitnessData.settings || {},
      lastModified: fitnessData.lastModified?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching fitness data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fitness data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json({
        success: true,
        lastModified: new Date().toISOString(),
      });
    }

    const body: FitnessData & { lastModified?: string } = await request.json();

    const updateData = {
      weightEntries: body.weightEntries || [],
      foodEntries: body.foodEntries || [],
      workoutEntries: body.workoutEntries || [],
      favoriteFoods: body.favoriteFoods || [],
      waterEntries: body.waterEntries || [],
      mealTemplates: body.mealTemplates || [],
      userProfile: body.userProfile || DEFAULT_PROFILE,
      settings: body.settings || {},
      lastModified: new Date(),
    };

    const fitnessData = await FitnessDataModel.findOneAndUpdate(
      { userId: USER_ID },
      updateData,
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      lastModified: fitnessData.lastModified?.toISOString(),
    });
  } catch (error) {
    console.error('Error saving fitness data:', error);
    return NextResponse.json(
      { error: 'Failed to save fitness data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
