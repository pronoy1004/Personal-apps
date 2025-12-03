const API_BASE = '/api/ai-insights';

export interface AIInsightsResponse {
  insights: string;
}

export interface AIInsightsError {
  error: string;
}

/**
 * Generate AI insights from fitness data
 */
export async function generateInsights(): Promise<string> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error: AIInsightsError = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Failed to generate insights: ${response.statusText}`);
    }

    const data: AIInsightsResponse = await response.json();
    return data.insights;
  } catch (error: any) {
    console.error('Error generating AI insights:', error);
    throw error;
  }
}

