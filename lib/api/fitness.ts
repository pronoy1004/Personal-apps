import type { FitnessData } from '@/lib/types';

const API_BASE = '/api/fitness';

export interface FitnessDataResponse extends FitnessData {
  lastModified?: string;
}

/**
 * Fetch fitness data from the API
 */
export async function fetchFitnessData(): Promise<FitnessDataResponse> {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error(`Failed to fetch fitness data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching fitness data:', error);
    throw error;
  }
}

/**
 * Save fitness data to the API
 */
export async function saveFitnessData(data: FitnessData): Promise<{ success: boolean; lastModified?: string }> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to save fitness data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving fitness data:', error);
    throw error;
  }
}

/**
 * Update fitness data in the API
 */
export async function updateFitnessData(data: FitnessData): Promise<{ success: boolean; lastModified?: string }> {
  return saveFitnessData(data);
}

/**
 * Check if fitness data needs syncing
 */
export async function checkFitnessSync(lastModified: string): Promise<{ needsUpdate: boolean; lastModified: string }> {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fitnessLastModified: lastModified,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to check sync: ${response.statusText}`);
    }

    const result = await response.json();
    return result.fitness || { needsUpdate: false, lastModified };
  } catch (error) {
    console.error('Error checking fitness sync:', error);
    return { needsUpdate: false, lastModified };
  }
}

