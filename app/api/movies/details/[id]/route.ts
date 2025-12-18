import { NextRequest, NextResponse } from 'next/server';
import { getMovieDetails, getTVDetails, getMovieWatchProviders, getTVWatchProviders, formatWatchProviders, getPosterUrl, getBackdropUrl } from '@/lib/api/movies';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'movie' | 'tv' | null;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    if (!type || (type !== 'movie' && type !== 'tv')) {
      return NextResponse.json(
        { error: 'Type must be "movie" or "tv"' },
        { status: 400 }
      );
    }

    const [details, providers] = await Promise.all([
      type === 'movie' ? getMovieDetails(id) : getTVDetails(id),
      type === 'movie' ? getMovieWatchProviders(id) : getTVWatchProviders(id),
    ]);

    return NextResponse.json({
      ...details,
      posterUrl: getPosterUrl(details.poster_path || undefined),
      backdropUrl: getBackdropUrl(details.backdrop_path || undefined),
      watchProviders: providers ? formatWatchProviders(providers) : [],
    });
  } catch (error: any) {
    console.error('Movie details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch movie/show details' },
      { status: 500 }
    );
  }
}

