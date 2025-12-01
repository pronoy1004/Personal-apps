import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import ApiKeysDataModel from '@/lib/models/ApiKeysData';
import type { ApiKeysData } from '@/lib/types';

const USER_ID = 'default-user';

function getDefaultApiKeysData(): ApiKeysData {
  return {
    passcodeHash: undefined,
    passcodeSalt: undefined,
    keys: [],
    lastModified: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json(getDefaultApiKeysData());
    }

    const data = await ApiKeysDataModel.findOne({ userId: USER_ID });
    if (!data) {
      return NextResponse.json(getDefaultApiKeysData());
    }

    return NextResponse.json({
      passcodeHash: data.passcodeHash || undefined,
      passcodeSalt: data.passcodeSalt || undefined,
      keys: data.keys || [],
      lastModified: data.lastModified?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching API keys data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys data' },
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

    const body: ApiKeysData = await request.json();

    const update = {
      passcodeHash: body.passcodeHash,
      passcodeSalt: body.passcodeSalt,
      keys: body.keys || [],
      lastModified: new Date(),
    };

    const saved = await ApiKeysDataModel.findOneAndUpdate(
      { userId: USER_ID },
      update,
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      lastModified: saved.lastModified?.toISOString(),
    });
  } catch (error) {
    console.error('Error saving API keys data:', error);
    return NextResponse.json(
      { error: 'Failed to save API keys data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

