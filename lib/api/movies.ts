import { getTMDBApiKey } from '../env';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w342';

// Watch provider IDs for India (IN region)
const INDIAN_PROVIDERS: Record<number, string> = {
  8: 'Netflix',
  9: 'Amazon Prime Video',
  337: 'Disney+ Hotstar',
  350: 'Apple TV+',
  2: 'Apple iTunes',
  3: 'Google Play Movies',
  192: 'YouTube',
  531: 'Paramount+',
  283: 'Crunchyroll',
  157: 'HBO Max',
  384: 'HBO',
  569: 'Max',
  563: 'JioCinema',
  558: 'ZEE5',
  559: 'SonyLIV',
  397: 'MUBI',
  458: 'Lionsgate Play',
};

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  media_type?: 'movie' | 'tv';
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  first_air_date?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  media_type?: 'movie' | 'tv';
}

export interface TMDBWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
  display_priority: number;
}

export interface TMDBWatchProviders {
  link?: string;
  flatrate?: TMDBWatchProvider[];
  rent?: TMDBWatchProvider[];
  buy?: TMDBWatchProvider[];
}

export interface TMDBWatchProvidersResponse {
  id: number;
  results: {
    IN?: TMDBWatchProviders;
  };
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBGenresResponse {
  genres: TMDBGenre[];
}

export interface TMDBSearchResponse {
  page: number;
  results: Array<TMDBMovie | TMDBTVShow>;
  total_pages: number;
  total_results: number;
}

export interface TMDBDetailsResponse extends TMDBMovie {
  genres: Array<{ id: number; name: string }>;
  runtime?: number; // for movies
  episode_run_time?: number[]; // for TV
}

export interface TMDBTVDetailsResponse extends TMDBTVShow {
  genres: Array<{ id: number; name: string }>;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
}

/**
 * Get TMDB API key from environment or throw error
 */
function getAPIKey(): string {
  const key = getTMDBApiKey();
  if (!key) {
    throw new Error('TMDB API key not configured. Please set TMDB_API_KEY environment variable or add it to the API Keys Vault.');
  }
  return key;
}

/**
 * Make a request to TMDB API
 */
async function tmdbRequest<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
  const apiKey = getAPIKey();
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'en-US');

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ status_message: 'Unknown error' }));
    throw new Error(`TMDB API error: ${error.status_message || response.statusText}`);
  }

  return response.json();
}

/**
 * Search movies and TV shows
 */
export async function searchTMDB(
  query: string,
  type: 'movie' | 'tv' | 'both' = 'both',
  page: number = 1
): Promise<TMDBSearchResponse> {
  if (!query || query.trim().length < 1) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }

  if (type === 'both') {
    // Search both and combine results
    const [moviesResult, tvResult] = await Promise.all([
      tmdbRequest<TMDBSearchResponse>('/search/movie', { query, page }).catch(() => ({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      })),
      tmdbRequest<TMDBSearchResponse>('/search/tv', { query, page }).catch(() => ({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      })),
    ]);

    // Combine and sort by popularity
    const combinedResults = [
      ...moviesResult.results.map((item) => ({ ...item, media_type: 'movie' as const })),
      ...tvResult.results.map((item) => ({ ...item, media_type: 'tv' as const })),
    ].sort((a, b) => b.popularity - a.popularity);

    return {
      page,
      results: combinedResults.slice(0, 20), // Limit to 20 results per page
      total_pages: Math.max(moviesResult.total_pages, tvResult.total_pages),
      total_results: moviesResult.total_results + tvResult.total_results,
    };
  }

  const endpoint = type === 'movie' ? '/search/movie' : '/search/tv';
  return tmdbRequest<TMDBSearchResponse>(endpoint, { query, page });
}

/**
 * Get movie details by ID
 */
export async function getMovieDetails(id: number): Promise<TMDBDetailsResponse> {
  return tmdbRequest<TMDBDetailsResponse>(`/movie/${id}`);
}

/**
 * Get TV show details by ID
 */
export async function getTVDetails(id: number): Promise<TMDBTVDetailsResponse> {
  return tmdbRequest<TMDBTVDetailsResponse>(`/tv/${id}`);
}

/**
 * Get watch providers for a movie (India region)
 */
export async function getMovieWatchProviders(id: number): Promise<TMDBWatchProviders | null> {
  try {
    const response = await tmdbRequest<TMDBWatchProvidersResponse>(`/movie/${id}/watch/providers`);
    return response.results.IN || null;
  } catch (error) {
    console.error('Error fetching watch providers:', error);
    return null;
  }
}

/**
 * Get watch providers for a TV show (India region)
 */
export async function getTVWatchProviders(id: number): Promise<TMDBWatchProviders | null> {
  try {
    const response = await tmdbRequest<TMDBWatchProvidersResponse>(`/tv/${id}/watch/providers`);
    return response.results.IN || null;
  } catch (error) {
    console.error('Error fetching watch providers:', error);
    return null;
  }
}

/**
 * Get recommendations for a movie
 */
export async function getMovieRecommendations(id: number, page: number = 1): Promise<TMDBSearchResponse> {
  const response = await tmdbRequest<{ page: number; results: TMDBMovie[]; total_pages: number; total_results: number }>(
    `/movie/${id}/recommendations`,
    { page }
  );
  return {
    ...response,
    results: response.results.map((item) => ({ ...item, media_type: 'movie' as const })),
  };
}

/**
 * Get recommendations for a TV show
 */
export async function getTVRecommendations(id: number, page: number = 1): Promise<TMDBSearchResponse> {
  const response = await tmdbRequest<{ page: number; results: TMDBTVShow[]; total_pages: number; total_results: number }>(
    `/tv/${id}/recommendations`,
    { page }
  );
  return {
    ...response,
    results: response.results.map((item) => ({ ...item, media_type: 'tv' as const })),
  };
}

/**
 * Get genre list
 */
export async function getGenres(type: 'movie' | 'tv'): Promise<TMDBGenre[]> {
  const endpoint = type === 'movie' ? '/genre/movie/list' : '/genre/tv/list';
  const response = await tmdbRequest<TMDBGenresResponse>(endpoint);
  return response.genres;
}

/**
 * Map provider ID to readable name
 */
export function getProviderName(providerId: number): string {
  return INDIAN_PROVIDERS[providerId] || `Provider ${providerId}`;
}

/**
 * Get image URL for poster
 */
export function getPosterUrl(posterPath: string | null | undefined): string | null {
  if (!posterPath) return null;
  return `${TMDB_POSTER_BASE_URL}${posterPath}`;
}

/**
 * Get image URL for backdrop
 */
export function getBackdropUrl(backdropPath: string | null | undefined): string | null {
  if (!backdropPath) return null;
  return `${TMDB_IMAGE_BASE_URL}${backdropPath}`;
}

/**
 * Format watch providers for display
 */
export function formatWatchProviders(providers: TMDBWatchProviders | null): Array<{
  id: number;
  name: string;
  logoPath?: string;
  type: 'flatrate' | 'rent' | 'buy';
}> {
  if (!providers) return [];

  const formatted: Array<{ id: number; name: string; logoPath?: string; type: 'flatrate' | 'rent' | 'buy' }> = [];

  if (providers.flatrate) {
    providers.flatrate.forEach((provider) => {
      formatted.push({
        id: provider.provider_id,
        name: getProviderName(provider.provider_id),
        logoPath: provider.logo_path ? `https://image.tmdb.org/t/p/w92${provider.logo_path}` : undefined,
        type: 'flatrate',
      });
    });
  }

  if (providers.rent) {
    providers.rent.forEach((provider) => {
      formatted.push({
        id: provider.provider_id,
        name: getProviderName(provider.provider_id),
        logoPath: provider.logo_path ? `https://image.tmdb.org/t/p/w92${provider.logo_path}` : undefined,
        type: 'rent',
      });
    });
  }

  if (providers.buy) {
    providers.buy.forEach((provider) => {
      formatted.push({
        id: provider.provider_id,
        name: getProviderName(provider.provider_id),
        logoPath: provider.logo_path ? `https://image.tmdb.org/t/p/w92${provider.logo_path}` : undefined,
        type: 'buy',
      });
    });
  }

  return formatted;
}

