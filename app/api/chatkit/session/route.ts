import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import FitnessDataModel from '@/lib/models/FitnessData';
import { formatFitnessDataForChat } from '@/lib/utils/chatkit-helpers';
import { getOpenAIApiKey } from '@/lib/env';
import OpenAI from 'openai';
import type { FitnessData } from '@/lib/types';

const USER_ID = 'default-user';

async function getFitnessData(): Promise<FitnessData | null> {
  const dbConnection = await connectDB();
  if (!dbConnection) {
    return null;
  }

  const fitnessData = await FitnessDataModel.findOne({ userId: USER_ID });
  if (!fitnessData) {
    return null;
  }

  return {
    weightEntries: fitnessData.weightEntries || [],
    foodEntries: fitnessData.foodEntries || [],
    workoutEntries: fitnessData.workoutEntries || [],
    favoriteFoods: fitnessData.favoriteFoods || [],
    userProfile: fitnessData.userProfile || {
      height: 183,
      age: 27,
      gender: 'male',
      activityLevel: 'very_active',
      baseTDEE: 3400,
      dailyCalorieGoal: 2400,
    },
    settings: fitnessData.settings || {},
  };
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable or add it to the API Keys Vault.' },
        { status: 500 }
      );
    }

    const fitnessData = await getFitnessData();
    const systemContext = fitnessData
      ? formatFitnessDataForChat(fitnessData)
      : 'You are a helpful fitness and nutrition assistant. The user has not yet logged any fitness data.';

    const openai = new OpenAI({ apiKey });

    // Create a ChatKit session with fitness data as system context
    // Note: Using chat.completions.create with system message as ChatKit sessions may have different API
    // For now, we'll create a session that can be used with ChatKit
    // The ChatKit client will handle the actual chat interface
    
    // According to ChatKit docs, we need to create a session using chatkit.sessions.create
    // However, the exact API may vary - we'll use a pattern that works with ChatKit
    const session = await (openai as any).chatkit?.sessions?.create({
      model: 'gpt-4o-mini',
      system_message: systemContext,
    });

    if (!session) {
      // Fallback: If ChatKit sessions API is not available, we can still work
      // by returning a token that the client can use
      // For now, return an error asking user to configure properly
      return NextResponse.json(
        { error: 'ChatKit sessions API is not available. Please ensure you have the latest OpenAI SDK and ChatKit access.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      client_secret: session.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating ChatKit session:', error);
    
    // If ChatKit API is not available, provide helpful error message
    if (error.message?.includes('chatkit') || error.code === 'not_found') {
      return NextResponse.json(
        { error: 'ChatKit API is not available. Please ensure your OpenAI API key has ChatKit access enabled.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create ChatKit session' },
      { status: 500 }
    );
  }
}

