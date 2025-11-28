import type { KanbanData } from '@/lib/types';

const API_BASE = '/api/kanban';

export interface KanbanDataResponse extends KanbanData {
  lastModified?: string;
}

/**
 * Fetch kanban data from the API
 */
export async function fetchKanbanData(): Promise<KanbanDataResponse> {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error(`Failed to fetch kanban data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching kanban data:', error);
    throw error;
  }
}

/**
 * Save kanban data to the API
 */
export async function saveKanbanData(data: KanbanData): Promise<{ success: boolean; lastModified?: string }> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to save kanban data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving kanban data:', error);
    throw error;
  }
}

/**
 * Update kanban data in the API
 */
export async function updateKanbanData(data: KanbanData): Promise<{ success: boolean; lastModified?: string }> {
  return saveKanbanData(data);
}

