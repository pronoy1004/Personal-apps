/**
 * Environment variables configuration
 * 
 * This file provides type-safe access to environment variables.
 * All environment variables should be accessed through this file.
 */

interface EnvConfig {
  mongodb: {
    uri: string | undefined;
  };
  app: {
    url: string | undefined;
  };
  api: {
    calorieNinjasKey: string | undefined;
    usdaKey: string | undefined;
    tmdbKey: string | undefined;
  };
}

/**
 * Get MongoDB connection URI
 * @returns MongoDB connection string or undefined
 */
export function getMongoDbUri(): string | undefined {
  return process.env.MONGODB_URI;
}

/**
 * Get application URL
 * @returns Application URL or undefined
 */
export function getAppUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_APP_URL;
}

/**
 * Get CalorieNinjas API key
 * @returns API key or undefined
 */
export function getCalorieNinjasApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_CALORIE_NINJAS_API_KEY;
}

/**
 * Get USDA FoodData Central API key (free, get at https://api.data.gov/signup/)
 * @returns API key or undefined
 */
export function getUSDAApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_USDA_API_KEY;
}

/**
 * Get OpenAI API key
 * First tries environment variable OPENAI_API_KEY (server-side only)
 * @returns API key or undefined
 */
export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

/**
 * Get TMDB API key (The Movie Database)
 * Server-side only for security
 * @returns API key or undefined
 */
export function getTMDBApiKey(): string | undefined {
  return process.env.TMDB_API_KEY;
}

/**
 * Get all environment configuration
 * @returns Environment configuration object
 */
export function getEnvConfig(): EnvConfig {
  return {
    mongodb: {
      uri: getMongoDbUri(),
    },
    app: {
      url: getAppUrl(),
    },
    api: {
      calorieNinjasKey: getCalorieNinjasApiKey(),
      usdaKey: getUSDAApiKey(),
      tmdbKey: getTMDBApiKey(),
    },
  };
}

/**
 * Environment constants for direct access
 * Use these constants throughout the application
 */
export const ENV = {
  MONGODB_URI: process.env.MONGODB_URI,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  CALORIE_NINJAS_API_KEY: process.env.CALORIE_NINJAS_API_KEY || process.env.NEXT_PUBLIC_CALORIE_NINJAS_API_KEY,
  USDA_API_KEY: process.env.USDA_API_KEY || process.env.NEXT_PUBLIC_USDA_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  TMDB_API_KEY: process.env.TMDB_API_KEY,
  NEXT_PUBLIC_CALORIE_NINJAS_API_KEY: process.env.NEXT_PUBLIC_CALORIE_NINJAS_API_KEY,
  NEXT_PUBLIC_USDA_API_KEY: process.env.NEXT_PUBLIC_USDA_API_KEY,
} as const;

/**
 * Validate required environment variables
 * @throws Error if required environment variables are missing
 */
export function validateEnv(): void {
  const requiredVars: Array<{ name: string; value: string | undefined }> = [
    // Add required variables here if needed
    // { name: 'MONGODB_URI', value: ENV.MONGODB_URI },
  ];

  const missingVars = requiredVars.filter(({ value }) => !value);

  if (missingVars.length > 0) {
    const missingNames = missingVars.map(({ name }) => name).join(', ');
    throw new Error(`Missing required environment variables: ${missingNames}`);
  }
}

