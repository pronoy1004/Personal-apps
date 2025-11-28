import type { Macros } from '../types';
import { ENV } from '../env';

export interface FoodSearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  unit?: string;
}

/**
 * Search for food using Open Food Facts API (primary, completely free)
 * Falls back to CalorieNinjas if Open Food Facts fails
 */
export async function searchFood(query: string): Promise<FoodSearchResult[]> {
  // Try Open Food Facts first (completely free, no API key needed)
  try {
    const result = await searchOpenFoodFacts(query);
    if (result && result.length > 0) {
      return result;
    }
  } catch (error) {
    console.warn('Open Food Facts API error, trying fallback:', error);
  }

  // Fallback to CalorieNinjas (may require API key)
  try {
    const result = await searchCalorieNinjas(query);
    if (result && result.length > 0) {
      return result;
    }
  } catch (error) {
    console.warn('CalorieNinjas API error:', error);
  }

  // If both fail, return empty array
  return [];
}

/**
 * Search CalorieNinjas API (fallback)
 * Note: May require API key for production use
 * Get free API key at: https://calorieninjas.com/
 */
async function searchCalorieNinjas(query: string): Promise<FoodSearchResult[]> {
  // CalorieNinjas API endpoint
  // You can get a free API key from https://calorieninjas.com/
  // For now, this will likely fail without an API key, but serves as a fallback
  const apiKey = ENV.NEXT_PUBLIC_CALORIE_NINJAS_API_KEY || '';
  const url = `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`;
  
  try {
    const headers: HeadersInit = {};
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`CalorieNinjas API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map((item: any) => ({
      name: item.name || query,
      calories: item.calories || 0,
      protein: item.protein_g || 0,
      carbs: item.carbohydrates_total_g || 0,
      fat: item.fat_total_g || 0,
      servingSize: '100g',
      unit: 'g',
    }));
  } catch (error) {
    // If API key is required and not provided, or other errors
    throw error;
  }
}

/**
 * Search Open Food Facts API (primary)
 * Completely free, no API key required, no rate limits
 */
async function searchOpenFoodFacts(query: string): Promise<FoodSearchResult[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      return [];
    }

    return data.products
      .filter((product: any) => product.nutriments && product.nutriments['energy-kcal_100g']) // Only products with valid nutrition data
      .map((product: any) => {
        const nutriments = product.nutriments;
        // Get the best available name
        const name = product.product_name || product.product_name_en || product.product_name_fr || query;
        
        return {
          name: name,
          calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
          protein: Math.round((nutriments['proteins_100g'] || nutriments['proteins'] || 0) * 10) / 10,
          carbs: Math.round((nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || 0) * 10) / 10,
          fat: Math.round((nutriments['fat_100g'] || nutriments['fat'] || 0) * 10) / 10,
          servingSize: '100g',
          unit: 'g',
        };
      })
      .filter((item: FoodSearchResult) => item.calories > 0) // Only return items with valid calories
      .slice(0, 10); // Limit to top 10 results
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
  };
}

