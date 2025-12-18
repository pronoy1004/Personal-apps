import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import MoviesDataModel from '@/lib/models/MoviesData';

const USER_ID = 'default-user';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'json') as 'json' | 'csv';

    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const data = await MoviesDataModel.findOne({ userId: USER_ID });
    if (!data) {
      return NextResponse.json(
        { error: 'No data found' },
        { status: 404 }
      );
    }

    if (format === 'json') {
      return NextResponse.json({
        mediaEntries: data.mediaEntries || [],
        watchEntries: data.watchEntries || [],
        preferences: data.preferences || {},
        exportedAt: new Date().toISOString(),
      });
    } else {
      // CSV format
      const watched = (data.watchEntries || []).filter((e) => e.status === 'watched');
      const watchlist = (data.watchEntries || []).filter((e) => e.status === 'watchlist');

      let csv = 'Type,Title,Status,Rating,Watched Date,Added Date,Notes\n';
      
      [...watched, ...watchlist].forEach((entry) => {
        const media = (data.mediaEntries || []).find((m) => m.id === entry.mediaId);
        if (media) {
          const rating = entry.rating === 'thumbs_up' ? 'Thumbs Up' : entry.rating === 'thumbs_down' ? 'Thumbs Down' : '';
          csv += `"${media.type}","${media.title.replace(/"/g, '""')}","${entry.status}","${rating}","${entry.watchedDate || ''}","${entry.addedDate}","${(entry.notes || '').replace(/"/g, '""')}"\n`;
        }
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="movies-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export data' },
      { status: 500 }
    );
  }
}

