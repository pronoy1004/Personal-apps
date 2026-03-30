import { NextRequest } from 'next/server';
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
    waterEntries: fitnessData.waterEntries || [],
    mealTemplates: fitnessData.mealTemplates || [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();
    const { message, conversation } = body;

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const fitnessData = await getFitnessData();
    const systemContext = fitnessData
      ? formatFitnessDataForChat(fitnessData)
      : 'You are a helpful fitness and nutrition assistant. The user has not yet logged any fitness data.';

    const openai = new OpenAI({ apiKey });

    // Build conversation history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemContext,
      },
    ];

    // Add conversation history (last 10 messages to keep context manageable)
    if (Array.isArray(conversation)) {
      const recentConversation = conversation.slice(-10);
      recentConversation.forEach((msg: { role: string; content: string }) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Create a streaming response
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    // Create a readable stream
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error: any) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message || 'Stream error' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process chat message' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

