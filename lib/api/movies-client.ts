import type { MoviesData } from '@/lib/types';

const API_BASE = '/api/movies';

export interface MoviesDataResponse extends MoviesData {
  lastModified?: string;
}

/**
 * Fetch movies data from the API
 */
export async function fetchMoviesData(): Promise<MoviesDataResponse> {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error(`Failed to fetch movies data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching movies data:', error);
    throw error;
  }
}

/**
 * Save movies data to the API
 */
export async function saveMoviesData(data: MoviesData): Promise<{ success: boolean; lastModified?: string }> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to save movies data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving movies data:', error);
    throw error;
  }
}

/**
 * Update movies data in the API
 */
export async function updateMoviesData(data: MoviesData): Promise<{ success: boolean; lastModified?: string }> {
  return saveMoviesData(data);
}

