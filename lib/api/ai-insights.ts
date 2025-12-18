const API_BASE = '/api/ai-insights';

export interface AIInsightsResponse {
  insights: string;
}

export interface AIInsightsError {
  error: string;
}

/**
 * Generate AI insights from fitness data
 * @param days - Optional number of days to analyze. If not provided, will be calculated from available data
 */
export async function generateInsights(days?: number): Promise<string> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: days ? JSON.stringify({ days }) : undefined,
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

