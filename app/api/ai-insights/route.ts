import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import FitnessDataModel from '@/lib/models/FitnessData';
import { summarizeFitnessData } from '@/lib/utils/fitness-summary';
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
    if (!fitnessData) {
      return NextResponse.json(
        { error: 'No fitness data found' },
        { status: 404 }
      );
    }

    // Get days parameter from request body, default to calculating from available data
    let days: number | undefined;
    try {
      const body = await request.json();
      days = body.days;
    } catch {
      // No body or invalid JSON, will calculate dynamically
    }

    // Calculate available data range if days not provided
    if (!days || days <= 0) {
      const now = new Date();
      let oldestDate = now;
      
      // Find oldest entry from all data types
      if (fitnessData.foodEntries.length > 0) {
        const oldestFood = new Date(Math.min(...fitnessData.foodEntries.map(e => new Date(e.timestamp).getTime())));
        if (oldestFood < oldestDate) oldestDate = oldestFood;
      }
      if (fitnessData.weightEntries.length > 0) {
        const oldestWeight = new Date(Math.min(...fitnessData.weightEntries.map(e => new Date(e.date).getTime())));
        if (oldestWeight < oldestDate) oldestDate = oldestWeight;
      }
      if (fitnessData.workoutEntries.length > 0) {
        const oldestWorkout = new Date(Math.min(...fitnessData.workoutEntries.map(e => new Date(e.date).getTime())));
        if (oldestWorkout < oldestDate) oldestDate = oldestWorkout;
      }
      
      // Calculate days between oldest and now
      if (oldestDate < now) {
        days = Math.ceil((now.getTime() - oldestDate.getTime()) / (24 * 60 * 60 * 1000));
        // Use minimum of available days and 30 for reasonable analysis
        days = Math.min(Math.max(days, 1), 30);
      } else {
        days = 30; // Fallback if no data or invalid dates
      }
    }

    const summary = summarizeFitnessData(fitnessData, days);

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a knowledgeable fitness and nutrition coach analyzing user data. Provide actionable insights, identify patterns, and give personalized recommendations. Be concise, specific, and encouraging.

IMPORTANT FORMATTING RULES:
1. First, provide a TLDR Summary section with a brief overview
2. Use ### for main section headings (e.g., ### Key Observations)
3. For numbered items, use ONE of these formats (choose consistently):
   - Format A: "1. **Title**: description" (number, period, space, bold title, colon, content)
   - Format B: Put number on its own line, then "**Title**: description" on next line
4. DO NOT use double numbering (e.g., "1. **1. **Title" is WRONG)
5. Each numbered item should be on its own line(s)
6. Keep formatting clean - no duplicate numbers or malformed markdown

Sections to include:
- TLDR Summary
- Key Observations (use numbered list)
- Strengths (use numbered list or bold items)
- Areas for Improvement (use numbered list)
- Recommendations (use numbered list)`,
        },
        {
          role: 'user',
          content: `Please analyze the following fitness data and provide insights:\n\n${summary}\n\nFormat your response exactly as specified: Start with "### TLDR Summary", then use "### Key Observations", "### Strengths", "### Areas for Improvement", and "### Recommendations" as section headings. Use numbered items with **bold** titles. Make sure each item uses clean formatting without duplicate numbers.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const insights = completion.choices[0]?.message?.content || 'Unable to generate insights at this time.';

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('Error generating AI insights:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

