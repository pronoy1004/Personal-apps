import type { MoviesData, MediaEntry, WatchEntry, UserPreferences } from '../types';
import { getMovieRecommendations, getTVRecommendations, type TMDBMovie, type TMDBTVShow } from '../api/movies';

interface RecommendationScore {
  media: MediaEntry;
  score: number;
  reasons: string[];
}

/**
 * Calculate content similarity score based on genres
 */
function calculateContentSimilarity(
  item1: MediaEntry,
  item2: MediaEntry,
  genreWeights: Record<string, number>
): number {
  const genres1 = new Set(item1.genres);
  const genres2 = new Set(item2.genres);

  if (genres1.size === 0 || genres2.size === 0) return 0;

  // Calculate intersection
  let intersection = 0;
  let totalWeight = 0;

  genres1.forEach((genre) => {
    if (genres2.has(genre)) {
      const weight = genreWeights[genre] || 1.0;
      intersection += weight;
    }
    totalWeight += genreWeights[genre] || 1.0;
  });

  if (totalWeight === 0) return 0;

  // Jaccard similarity weighted by user preferences
  return intersection / Math.max(genres1.size, genres2.size);
}

/**
 * Normalize popularity score (0-1 range)
 * Assuming TMDB popularity ranges roughly 0-1000
 */
function normalizePopularity(popularity: number): number {
  return Math.min(popularity / 1000, 1.0);
}

/**
 * Calculate user preference weight for a media item
 */
function calculateUserPreferenceWeight(
  item: MediaEntry,
  preferences: UserPreferences
): number {
  let weight = 0.5; // Base weight

  // Check if item type is preferred
  if (preferences.preferredTypes.includes(item.type)) {
    weight += 0.2;
  }

  // Check genre preferences
  let genreMatch = false;
  item.genres.forEach((genre) => {
    const genreWeight = preferences.genreWeights[genre] || 0.5;
    if (genreWeight > 0.7) {
      genreMatch = true;
      weight += 0.1;
    }
  });

  if (genreMatch) {
    weight += 0.2;
  }

  return Math.min(weight, 1.0);
}

/**
 * Refine user preferences based on ratings
 */
export function refinePreferences(
  currentPreferences: UserPreferences,
  watchedItems: Array<{ media: MediaEntry; rating: 'thumbs_up' | 'thumbs_down' }>
): UserPreferences {
  const genreWeights = { ...currentPreferences.genreWeights };
  const now = new Date().toISOString();

  // Count thumbs up and thumbs down per genre
  const genreStats: Record<string, { up: number; down: number }> = {};

  watchedItems.forEach(({ media, rating }) => {
    media.genres.forEach((genre) => {
      if (!genreStats[genre]) {
        genreStats[genre] = { up: 0, down: 0 };
      }
      if (rating === 'thumbs_up') {
        genreStats[genre].up += 1;
      } else {
        genreStats[genre].down += 1;
      }
    });
  });

  // Update genre weights based on ratios
  Object.entries(genreStats).forEach(([genre, stats]) => {
    const total = stats.up + stats.down;
    if (total > 0) {
      const ratio = stats.up / total;
      // Convert ratio (0-1) to weight (0.3-1.0)
      // Thumbs down heavy -> 0.3, thumbs up heavy -> 1.0
      genreWeights[genre] = 0.3 + ratio * 0.7;
    }
  });

  return {
    ...currentPreferences,
    genreWeights,
    lastRefined: now,
  };
}

/**
 * Generate personalized recommendations
 */
export async function generateRecommendations(
  data: MoviesData,
  limit: number = 20
): Promise<Array<{ media: MediaEntry; score: number; reasons: string[] }>> {
  // Get all watched items with thumbs up
  const watchedEntries = data.watchEntries.filter((e) => e.status === 'watched');
  const thumbsUpItems = watchedEntries
    .filter((e) => e.rating === 'thumbs_up')
    .map((e) => {
      const media = data.mediaEntries.find((m) => m.id === e.mediaId);
      return media ? { media, entry: e } : null;
    })
    .filter((item): item is { media: MediaEntry; entry: WatchEntry } => item !== null);

  // If no thumbs up items, return empty or use popularity-based recommendations
  if (thumbsUpItems.length === 0) {
    return [];
  }

  // Refine preferences based on ratings
  const refinedPreferences = refinePreferences(
    data.preferences,
    watchedEntries
      .filter((e) => e.rating)
      .map((e) => {
        const media = data.mediaEntries.find((m) => m.id === e.mediaId);
        return media && e.rating ? { media, rating: e.rating } : null;
      })
      .filter((item): item is { media: MediaEntry; rating: 'thumbs_up' | 'thumbs_down' } => item !== null)
  );

  // Get existing media IDs to exclude
  const existingIds = new Set(data.mediaEntries.map((m) => m.tmdbId));

  // Collect recommendations from TMDB for thumbs up items
  const candidateMap = new Map<number, { media: MediaEntry; scores: number[]; reasons: string[] }>();

  // Get recommendations from each thumbs up item
  for (const { media } of thumbsUpItems.slice(0, 5)) { // Limit to top 5 items to avoid too many API calls
    try {
      const tmdbRecs = media.type === 'movie'
        ? await getMovieRecommendations(media.tmdbId, 1)
        : await getTVRecommendations(media.tmdbId, 1);

      tmdbRecs.results.slice(0, 10).forEach((tmdbItem: TMDBMovie | TMDBTVShow) => {
        // Skip if already in user's collection
        if (existingIds.has(tmdbItem.id)) return;

        // Check if we already have this as a MediaEntry
        const existingMedia = data.mediaEntries.find(
          (m) => m.tmdbId === tmdbItem.id && m.type === (tmdbItem.media_type || media.type)
        );

        let mediaEntry: MediaEntry;
        if (existingMedia) {
          mediaEntry = existingMedia;
        } else {
          // Create a MediaEntry from TMDB data
          mediaEntry = {
            id: '', // Will be set when added
            tmdbId: tmdbItem.id,
            type: (tmdbItem.media_type || media.type) as 'movie' | 'tv',
            title: 'title' in tmdbItem ? tmdbItem.title : tmdbItem.name,
            posterPath: tmdbItem.poster_path || undefined,
            backdropPath: tmdbItem.backdrop_path || undefined,
            overview: tmdbItem.overview || '',
            releaseDate: 'release_date' in tmdbItem ? tmdbItem.release_date : undefined,
            firstAirDate: 'first_air_date' in tmdbItem ? tmdbItem.first_air_date : undefined,
            genres: tmdbItem.genre_ids?.map(String) || [],
            rating: tmdbItem.vote_average || 0,
            popularity: tmdbItem.popularity || 0,
            addedAt: new Date().toISOString(),
          };
        }

        // Calculate scores
        const contentScore = calculateContentSimilarity(media, mediaEntry, refinedPreferences.genreWeights);
        const popularityScore = normalizePopularity(mediaEntry.popularity);
        const preferenceScore = calculateUserPreferenceWeight(mediaEntry, refinedPreferences);

        // Combined score
        const finalScore = contentScore * 0.5 + popularityScore * 0.3 + preferenceScore * 0.2;

        if (!candidateMap.has(mediaEntry.tmdbId)) {
          candidateMap.set(mediaEntry.tmdbId, {
            media: mediaEntry,
            scores: [],
            reasons: [],
          });
        }

        const candidate = candidateMap.get(mediaEntry.tmdbId)!;
        candidate.scores.push(finalScore);

        // Build reasons
        if (contentScore > 0.5) {
          const commonGenres = media.genres.filter((g) => mediaEntry.genres.includes(g));
          if (commonGenres.length > 0) {
            candidate.reasons.push(`Similar genres: ${commonGenres.slice(0, 2).join(', ')}`);
          }
        }
        if (mediaEntry.rating > 7) {
          candidate.reasons.push(`High rating (${mediaEntry.rating.toFixed(1)}/10)`);
        }
      });
    } catch (error) {
      console.error(`Error fetching recommendations for ${media.title}:`, error);
    }
  }

  // Average scores and create final recommendations
  const recommendations: RecommendationScore[] = Array.from(candidateMap.values()).map((candidate) => {
    const avgScore = candidate.scores.reduce((sum, s) => sum + s, 0) / candidate.scores.length;
    return {
      media: candidate.media,
      score: avgScore,
      reasons: [...new Set(candidate.reasons)].slice(0, 3), // Unique reasons, max 3
    };
  });

  // Sort by score and return top N
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

