import type { ApiKeysData } from '@/lib/types';

const API_BASE = '/api/api-keys';

export async function fetchApiKeysData(): Promise<ApiKeysData> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to fetch API keys data: ${response.statusText}`);
  }
  return response.json();
}

export async function saveApiKeysData(data: ApiKeysData): Promise<{ success: boolean; lastModified?: string }> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to save API keys data: ${response.statusText}`);
  }

  return response.json();
}

