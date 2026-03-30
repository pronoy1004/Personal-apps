import type { Macros } from '../types';
import { ENV } from '../env';

export interface FoodSearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize?: string;
  unit?: string;
  source?: string;
}

export interface SearchFoodOptions {
  page?: number;
  pageSize?: number;
}

export async function searchFoodClient(query: string, options?: SearchFoodOptions): Promise<FoodSearchResult[]> {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;

  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  const response = await fetch(`/api/food/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to search for food');
  }

  return response.json();
}

export async function searchFood(query: string, options?: SearchFoodOptions): Promise<FoodSearchResult[]> {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;

  const allResults: FoodSearchResult[] = [];

  const usdaResults = await searchUSDAFoodData(query, page, pageSize).catch(() => []);
  allResults.push(...usdaResults);

  const calorieNinjasResults = await searchCalorieNinjas(query).catch(() => []);
  allResults.push(...calorieNinjasResults);

  const openFoodFactsResults = await searchOpenFoodFacts(query, page, pageSize).catch(() => []);
  allResults.push(...openFoodFactsResults);

  return deduplicateAndRankResults(allResults, query).slice(0, pageSize * 2);
}

function deduplicateAndRankResults(results: FoodSearchResult[], query: string): FoodSearchResult[] {
  const seen = new Map<string, FoodSearchResult>();

  const sourcePriority: Record<string, number> = {
    'USDA': 3,
    'CalorieNinjas': 2,
    'Open Food Facts': 1,
  };

  results.forEach((item) => {
    const key = item.name.toLowerCase().trim();
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, item);
    } else {
      const itemSourcePriority = sourcePriority[item.source || ''] || 0;
      const existingSourcePriority = sourcePriority[existing.source || ''] || 0;

      if (itemSourcePriority > existingSourcePriority) {
        seen.set(key, item);
      } else if (itemSourcePriority === existingSourcePriority) {
        const itemScore = calculateMatchScore(item.name, query);
        const existingScore = calculateMatchScore(existing.name, query);
        if (itemScore > existingScore) {
          seen.set(key, item);
        }
      }
    }
  });

  return Array.from(seen.values())
    .sort((a, b) => {
      const scoreA = calculateMatchScore(a.name, query);
      const scoreB = calculateMatchScore(b.name, query);
      const sourcePriorityA = sourcePriority[a.source || ''] || 0;
      const sourcePriorityB = sourcePriority[b.source || ''] || 0;

      if (scoreA === scoreB) {
        return sourcePriorityB - sourcePriorityA;
      }
      return scoreB - scoreA;
    });
}

function calculateMatchScore(name: string, query: string): number {
  const nameLower = name.toLowerCase();
  const queryLower = query.toLowerCase();

  if (nameLower === queryLower) return 100;
  if (nameLower.startsWith(queryLower)) return 80;
  if (nameLower.includes(queryLower)) return 60;

  const queryWords = queryLower.split(/\s+/);
  const nameWords = nameLower.split(/\s+/);
  const matchingWords = queryWords.filter((qw) => nameWords.some((nw) => nw.includes(qw) || qw.includes(nw)));

  return (matchingWords.length / queryWords.length) * 40;
}

async function searchCalorieNinjas(query: string): Promise<FoodSearchResult[]> {
  const apiKey = process.env.CALORIE_NINJAS_API_KEY || process.env.NEXT_PUBLIC_CALORIE_NINJAS_API_KEY || '';

  if (!apiKey) {
    return [];
  }

  const url = `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, { headers: { 'X-Api-Key': apiKey } });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) return [];
      throw new Error(`CalorieNinjas API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];

    return data.items.map((item: any) => ({
      name: item.name || query,
      calories: item.calories || 0,
      protein: item.protein_g || 0,
      carbs: item.carbohydrates_total_g || 0,
      fat: item.fat_total_g || 0,
      fiber: item.fiber_g || undefined,
      sugar: item.sugar_g || undefined,
      sodium: item.sodium_mg || undefined,
      servingSize: '100g',
      unit: 'g',
      source: 'CalorieNinjas',
    }));
  } catch (error) {
    throw error;
  }
}

async function searchOpenFoodFacts(query: string, page: number = 1, pageSize: number = 20): Promise<FoodSearchResult[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open Food Facts API error: ${response.status}`);

    const data = await response.json();
    if (!data.products || data.products.length === 0) return [];

    return data.products
      .filter((product: any) => product.nutriments && product.nutriments['energy-kcal_100g'])
      .map((product: any) => {
        const n = product.nutriments;
        const name = product.product_name || product.product_name_en || product.product_name_fr || query;

        return {
          name,
          calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
          protein: Math.round((n['proteins_100g'] || n['proteins'] || 0) * 10) / 10,
          carbs: Math.round((n['carbohydrates_100g'] || n['carbohydrates'] || 0) * 10) / 10,
          fat: Math.round((n['fat_100g'] || n['fat'] || 0) * 10) / 10,
          fiber: n['fiber_100g'] != null ? Math.round(n['fiber_100g'] * 10) / 10 : undefined,
          sugar: n['sugars_100g'] != null ? Math.round(n['sugars_100g'] * 10) / 10 : undefined,
          sodium: n['sodium_100g'] != null ? Math.round(n['sodium_100g'] * 1000) : undefined, // convert g to mg
          servingSize: '100g',
          unit: 'g',
          source: 'Open Food Facts',
        };
      })
      .filter((item: FoodSearchResult) => item.calories > 0);
  } catch (error) {
    throw error;
  }
}

async function searchUSDAFoodData(query: string, page: number = 1, pageSize: number = 20): Promise<FoodSearchResult[]> {
  const apiKey = process.env.USDA_API_KEY || process.env.NEXT_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&pageNumber=${page}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 403 || response.status === 401) return [];
      throw new Error(`USDA API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.foods || data.foods.length === 0) return [];

    return data.foods
      .filter((food: any) => food.foodNutrients && food.foodNutrients.length > 0)
      .map((food: any) => {
        const nutrients = food.foodNutrients.reduce((acc: any, nutrient: any) => {
          const id = nutrient.nutrient?.id;
          const name = nutrient.nutrient?.name?.toLowerCase() || '';
          const value = nutrient.value || nutrient.amount || 0;

          if (id === 1008 || name.includes('energy') || name.includes('calories')) acc.energy = value;
          if (id === 1003 || name.includes('protein')) acc.protein = value;
          if (id === 1005 || name.includes('carbohydrate')) acc.carbs = value;
          if (id === 1004 || name.includes('total lipid') || name === 'fat') acc.fat = value;
          if (id === 1079 || name.includes('fiber')) acc.fiber = value;
          if (id === 2000 || name.includes('sugar')) acc.sugar = value;
          if (id === 1093 || name.includes('sodium')) acc.sodium = value;

          return acc;
        }, { energy: 0, protein: 0, carbs: 0, fat: 0 });

        const name = food.description || query;

        return {
          name,
          calories: Math.round(nutrients.energy || 0),
          protein: Math.round((nutrients.protein || 0) * 10) / 10,
          carbs: Math.round((nutrients.carbs || 0) * 10) / 10,
          fat: Math.round((nutrients.fat || 0) * 10) / 10,
          fiber: nutrients.fiber ? Math.round(nutrients.fiber * 10) / 10 : undefined,
          sugar: nutrients.sugar ? Math.round(nutrients.sugar * 10) / 10 : undefined,
          sodium: nutrients.sodium ? Math.round(nutrients.sodium) : undefined,
          servingSize: '100g',
          unit: 'g',
          source: 'USDA',
        };
      })
      .filter((item: FoodSearchResult) => item.calories > 0);
  } catch (error) {
    throw error;
  }
}

/**
 * Calculate macros for a given quantity of food
 */
export function calculateMacrosForQuantity(
  baseMacros: Macros,
  baseQuantity: number,
  targetQuantity: number
): Macros {
  const ratio = targetQuantity / baseQuantity;
  return {
    calories: Math.round(baseMacros.calories * ratio),
    protein: Math.round(baseMacros.protein * ratio * 10) / 10,
    carbs: Math.round(baseMacros.carbs * ratio * 10) / 10,
    fat: Math.round(baseMacros.fat * ratio * 10) / 10,
    fiber: baseMacros.fiber != null ? Math.round(baseMacros.fiber * ratio * 10) / 10 : undefined,
    sugar: baseMacros.sugar != null ? Math.round(baseMacros.sugar * ratio * 10) / 10 : undefined,
    sodium: baseMacros.sodium != null ? Math.round(baseMacros.sodium * ratio) : undefined,
  };
}
