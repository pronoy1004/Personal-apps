import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import KanbanDataModel from '@/lib/models/KanbanData';
import type { KanbanData } from '@/lib/types';

const USER_ID = 'default-user';

// GET - Fetch kanban data
export async function GET(request: NextRequest) {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      // MongoDB not configured, return empty structure
      return NextResponse.json({
        tasks: [],
        columns: [],
        settings: {
          theme: 'system',
          autoArchiveDays: 30,
          defaultPriority: 'medium',
          sortPreferences: {},
        },
        lastModified: new Date().toISOString(),
      });
    }
    
    let kanbanData = await KanbanDataModel.findOne({ userId: USER_ID });

    if (!kanbanData) {
      // Return empty structure if no data exists
      return NextResponse.json({
        tasks: [],
        columns: [],
        settings: {
          theme: 'system',
          autoArchiveDays: 30,
          defaultPriority: 'medium',
          sortPreferences: {},
        },
        lastModified: new Date().toISOString(),
      });
    }

    // Convert to plain object and format for client
    const data = {
      tasks: kanbanData.tasks || [],
      columns: kanbanData.columns || [],
      settings: kanbanData.settings || {
        theme: 'system',
        autoArchiveDays: 30,
        defaultPriority: 'medium',
        sortPreferences: {},
      },
      lastModified: kanbanData.lastModified?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching kanban data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kanban data' },
      { status: 500 }
    );
  }
}

// POST/PUT - Save kanban data
export async function POST(request: NextRequest) {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      // MongoDB not configured, return success (data will be saved in localStorage)
      return NextResponse.json({
        success: true,
        lastModified: new Date().toISOString(),
      });
    }
    
    const body: KanbanData & { lastModified?: string } = await request.json();
    
    const updateData = {
      tasks: body.tasks || [],
      columns: body.columns || [],
      settings: body.settings || {
        theme: 'system',
        autoArchiveDays: 30,
        defaultPriority: 'medium',
        sortPreferences: {},
      },
      lastModified: new Date(),
    };

    const kanbanData = await KanbanDataModel.findOneAndUpdate(
      { userId: USER_ID },
      updateData,
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      lastModified: kanbanData.lastModified?.toISOString(),
    });
  } catch (error) {
    console.error('Error saving kanban data:', error);
    return NextResponse.json(
      { error: 'Failed to save kanban data' },
      { status: 500 }
    );
  }
}

// PUT - Update kanban data (same as POST)
export async function PUT(request: NextRequest) {
  return POST(request);
}

