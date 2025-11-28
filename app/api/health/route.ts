import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import FitnessDataModel from '@/lib/models/FitnessData';
import KanbanDataModel from '@/lib/models/KanbanData';
import { ENV } from '@/lib/env';

const USER_ID = 'default-user';

/**
 * Health check endpoint to diagnose MongoDB connection issues
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      hasMongoDbUri: !!ENV.MONGODB_URI,
      mongoDbUriPreview: ENV.MONGODB_URI 
        ? ENV.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
        : 'NOT SET',
    },
    connection: {
      status: 'unknown',
      error: null,
    },
    database: {
      fitness: {
        connected: false,
        documentCount: 0,
        error: null,
      },
      kanban: {
        connected: false,
        documentCount: 0,
        error: null,
      },
    },
  };

  try {
    // Test connection
    const dbConnection = await connectDB();
    
    if (!dbConnection) {
      diagnostics.connection.status = 'failed';
      diagnostics.connection.error = 'MongoDB connection returned null. Check MONGODB_URI environment variable.';
      return NextResponse.json(diagnostics, { status: 503 });
    }

    diagnostics.connection.status = 'connected';

    // Test FitnessData collection
    try {
      const fitnessCount = await FitnessDataModel.countDocuments({ userId: USER_ID });
      const fitnessDoc = await FitnessDataModel.findOne({ userId: USER_ID });
      
      diagnostics.database.fitness.connected = true;
      diagnostics.database.fitness.documentCount = fitnessCount;
      diagnostics.database.fitness.hasData = !!fitnessDoc;
      if (fitnessDoc) {
        diagnostics.database.fitness.dataPreview = {
          weightEntries: fitnessDoc.weightEntries?.length || 0,
          foodEntries: fitnessDoc.foodEntries?.length || 0,
          workoutEntries: fitnessDoc.workoutEntries?.length || 0,
          favoriteFoods: fitnessDoc.favoriteFoods?.length || 0,
        };
      }
    } catch (error: any) {
      diagnostics.database.fitness.error = error?.message || 'Unknown error';
    }

    // Test KanbanData collection
    try {
      const kanbanCount = await KanbanDataModel.countDocuments({ userId: USER_ID });
      const kanbanDoc = await KanbanDataModel.findOne({ userId: USER_ID });
      
      diagnostics.database.kanban.connected = true;
      diagnostics.database.kanban.documentCount = kanbanCount;
      diagnostics.database.kanban.hasData = !!kanbanDoc;
      if (kanbanDoc) {
        diagnostics.database.kanban.dataPreview = {
          tasks: kanbanDoc.tasks?.length || 0,
          columns: kanbanDoc.columns?.length || 0,
        };
      }
    } catch (error: any) {
      diagnostics.database.kanban.error = error?.message || 'Unknown error';
    }

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    diagnostics.connection.status = 'error';
    diagnostics.connection.error = error?.message || 'Unknown error';
    return NextResponse.json(diagnostics, { status: 503 });
  }
}

