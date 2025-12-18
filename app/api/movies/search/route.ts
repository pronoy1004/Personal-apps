import { NextRequest, NextResponse } from 'next/server';
import { searchTMDB, getMovieWatchProviders, getTVWatchProviders, formatWatchProviders, getPosterUrl, getGenres } from '@/lib/api/movies';

// Genre mapping cache (could be improved with proper caching)
let genreCache: { movies: Map<number, string>; tv: Map<number, string> } | null = null;

async function getGenreMaps() {
  if (!genreCache) {
    const [movieGenres, tvGenres] = await Promise.all([
      getGenres('movie').catch(() => []),
      getGenres('tv').catch(() => []),
    ]);
    
    genreCache = {
      movies: new Map(movieGenres.map((g) => [g.id, g.name])),
      tv: new Map(tvGenres.map((g) => [g.id, g.name])),
    };
  }
  return genreCache;
}

function mapGenreIdsToNames(genreIds: number[] | undefined, type: 'movie' | 'tv', genreMap: Map<number, string>): string[] {
  if (!genreIds) return [];
  return genreIds.map((id) => genreMap.get(id) || `Genre ${id}`).filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = (searchParams.get('type') || 'both') as 'movie' | 'tv' | 'both';
    const page = parseInt(searchParams.get('page') || '1', 10);

    if (!query || query.trim().length < 1) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const results = await searchTMDB(query, type, page);
    const genreMaps = await getGenreMaps();

    // Enrich results with watch providers and genre names
    const enrichedResults = await Promise.all(
      results.results.map(async (item) => {
        // Determine type: check media_type first, then use property presence as fallback
        const itemType: 'movie' | 'tv' = 
          item.media_type || 
          (('release_date' in item && item.release_date) ? 'movie' : 
           ('first_air_date' in item && item.first_air_date) ? 'tv' : 
           'movie'); // default fallback
        
        const providers = itemType === 'movie'
          ? await getMovieWatchProviders(item.id).catch(() => null)
          : await getTVWatchProviders(item.id).catch(() => null);

        // Map genre IDs to names
        const genreIds = item.genre_ids || [];
        const genreNames = mapGenreIdsToNames(genreIds, itemType, genreMaps[itemType === 'movie' ? 'movies' : 'tv']);

        return {
          ...item,
          type: itemType,
          genres: genreNames,
          posterUrl: getPosterUrl(item.poster_path || undefined),
          watchProviders: providers ? formatWatchProviders(providers) : [],
        };
      })
    );

    return NextResponse.json({
      page: results.page,
      results: enrichedResults,
      totalPages: results.total_pages,
      totalResults: results.total_results,
    });
  } catch (error: any) {
    console.error('Movie search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search for movies/shows' },
      { status: 500 }
    );
  }
}

