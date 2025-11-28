/**
 * Sync utility for checking if data needs to be synced
 */

export interface SyncResult {
  kanban?: {
    lastModified: string;
    needsUpdate: boolean;
  };
  fitness?: {
    lastModified: string;
    needsUpdate: boolean;
  };
}

/**
 * Check sync status for both kanban and fitness data
 */
export async function checkSync(kanbanLastModified?: string, fitnessLastModified?: string): Promise<SyncResult> {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kanbanLastModified,
        fitnessLastModified,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to check sync: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking sync:', error);
    return {};
  }
}

