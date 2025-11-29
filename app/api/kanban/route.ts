import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import KanbanDataModel from '@/lib/models/KanbanData';
import type { KanbanData } from '@/lib/types';

const USER_ID = 'default-user';

export async function GET(request: NextRequest) {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
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

export async function POST(request: NextRequest) {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
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

export async function PUT(request: NextRequest) {
  return POST(request);
}

