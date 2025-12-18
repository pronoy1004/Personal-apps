import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import MoviesDataModel from '@/lib/models/MoviesData';
import { generateRecommendations } from '@/lib/utils/recommendations';
import { getMovieWatchProviders, getTVWatchProviders, formatWatchProviders, getPosterUrl } from '@/lib/api/movies';

const USER_ID = 'default-user';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json({ recommendations: [] });
    }

    const data = await MoviesDataModel.findOne({ userId: USER_ID });
    if (!data) {
      return NextResponse.json({ recommendations: [] });
    }

    const moviesData = {
      mediaEntries: data.mediaEntries || [],
      watchEntries: data.watchEntries || [],
      preferences: data.preferences || {
        genreWeights: {},
        preferredTypes: ['movie', 'tv'],
        lastRefined: new Date().toISOString(),
      },
      lastModified: data.lastModified?.toISOString() || new Date().toISOString(),
    };

    const recommendations = await generateRecommendations(moviesData, limit);

    // Enrich with watch providers
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const providers = rec.media.type === 'movie'
          ? await getMovieWatchProviders(rec.media.tmdbId).catch(() => null)
          : await getTVWatchProviders(rec.media.tmdbId).catch(() => null);

        return {
          ...rec,
          media: {
            ...rec.media,
            posterUrl: getPosterUrl(rec.media.posterPath),
          },
          watchProviders: providers ? formatWatchProviders(providers) : [],
        };
      })
    );

    return NextResponse.json({ recommendations: enrichedRecommendations });
  } catch (error: any) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

