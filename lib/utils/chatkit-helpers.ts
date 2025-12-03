import type { FitnessData } from '../types';
import { summarizeFitnessData } from './fitness-summary';

/**
 * Format fitness data as context for ChatKit
 * Returns a concise summary optimized for conversational AI
 */
export function formatFitnessDataForChat(fitnessData: FitnessData): string {
  const summary = summarizeFitnessData(fitnessData, 30);
  
  return `You are a helpful fitness and nutrition assistant. You have access to the following user data:

${summary}

You can answer questions about:
- Weight trends and progress
- Nutrition and calorie intake
- Exercise and workout patterns
- Goal alignment and recommendations
- TDEE and metabolic insights
- Any other fitness-related questions

Be conversational, helpful, and provide specific insights based on the data above. If asked about something not in the data, let the user know politely.`;
}

