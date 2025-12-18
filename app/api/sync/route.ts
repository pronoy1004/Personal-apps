import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import KanbanDataModel from '@/lib/models/KanbanData';
import FitnessDataModel from '@/lib/models/FitnessData';
import MoviesDataModel from '@/lib/models/MoviesData';

const USER_ID = 'default-user';

export async function POST(request: NextRequest) {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json({});
    }
    
    const body = await request.json();
    const { kanbanLastModified, fitnessLastModified, moviesLastModified } = body;

    const results: {
      kanban?: { lastModified: string; needsUpdate: boolean };
      fitness?: { lastModified: string; needsUpdate: boolean };
      movies?: { lastModified: string; needsUpdate: boolean };
    } = {};

    if (kanbanLastModified !== undefined) {
      const kanbanData = await KanbanDataModel.findOne({ userId: USER_ID });
      const serverLastModified = kanbanData?.lastModified?.toISOString();
      const clientLastModified = kanbanLastModified ? new Date(kanbanLastModified).toISOString() : null;
      
      results.kanban = {
        lastModified: serverLastModified || new Date().toISOString(),
        needsUpdate: !serverLastModified || 
          !clientLastModified || 
          new Date(serverLastModified) > new Date(clientLastModified),
      };
    }

    if (fitnessLastModified !== undefined) {
      const fitnessData = await FitnessDataModel.findOne({ userId: USER_ID });
      const serverLastModified = fitnessData?.lastModified?.toISOString();
      const clientLastModified = fitnessLastModified ? new Date(fitnessLastModified).toISOString() : null;
      
      results.fitness = {
        lastModified: serverLastModified || new Date().toISOString(),
        needsUpdate: !serverLastModified || 
          !clientLastModified || 
          new Date(serverLastModified) > new Date(clientLastModified),
      };
    }

    if (moviesLastModified !== undefined) {
      const moviesData = await MoviesDataModel.findOne({ userId: USER_ID });
      const serverLastModified = moviesData?.lastModified?.toISOString();
      const clientLastModified = moviesLastModified ? new Date(moviesLastModified).toISOString() : null;
      
      results.movies = {
        lastModified: serverLastModified || new Date().toISOString(),
        needsUpdate: !serverLastModified || 
          !clientLastModified || 
          new Date(serverLastModified) > new Date(clientLastModified),
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error syncing data:', error);
    return NextResponse.json(
      { error: 'Failed to sync data' },
      { status: 500 }
    );
  }
}

