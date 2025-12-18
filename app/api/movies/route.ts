import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import MoviesDataModel from '@/lib/models/MoviesData';
import type { MoviesData } from '@/lib/types';

const USER_ID = 'default-user';

function getDefaultMoviesData(): MoviesData {
  return {
    mediaEntries: [],
    watchEntries: [],
    preferences: {
      genreWeights: {},
      preferredTypes: ['movie', 'tv'],
      lastRefined: new Date().toISOString(),
    },
    lastModified: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json(getDefaultMoviesData());
    }

    const data = await MoviesDataModel.findOne({ userId: USER_ID });
    if (!data) {
      return NextResponse.json(getDefaultMoviesData());
    }

    const lastModified = data.lastModified?.toISOString() || new Date().toISOString();

    return NextResponse.json({
      mediaEntries: data.mediaEntries || [],
      watchEntries: data.watchEntries || [],
      preferences: data.preferences || getDefaultMoviesData().preferences,
      lastModified,
    });
  } catch (error) {
    console.error('Error fetching movies data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movies data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json(
        { success: true, lastModified: new Date().toISOString() },
        { status: 200 }
      );
    }

    const body = await request.json();
    const moviesData: MoviesData = {
      mediaEntries: body.mediaEntries || [],
      watchEntries: body.watchEntries || [],
      preferences: body.preferences || getDefaultMoviesData().preferences,
      lastModified: body.lastModified || new Date().toISOString(),
    };

    await MoviesDataModel.findOneAndUpdate(
      { userId: USER_ID },
      {
        userId: USER_ID,
        mediaEntries: moviesData.mediaEntries,
        watchEntries: moviesData.watchEntries,
        preferences: moviesData.preferences,
        lastModified: new Date(moviesData.lastModified),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      lastModified: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving movies data:', error);
    return NextResponse.json(
      { error: 'Failed to save movies data' },
      { status: 500 }
    );
  }
}

