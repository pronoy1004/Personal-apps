import mongoose from 'mongoose';
import { ENV } from '../env';

const MONGODB_URI: string | undefined = ENV.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global is used here to maintain a cached connection across hot reloads in development
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose | null> {
  // If MongoDB URI is not configured, return null (will use localStorage fallback)
  if (!MONGODB_URI) {
    console.warn('[MongoDB] MONGODB_URI not configured - using localStorage only');
    return null;
  }

  // Log connection attempt (without sensitive data)
  const uriPreview = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log(`[MongoDB] Attempting connection to: ${uriPreview}`);

  if (cached.conn) {
    console.log('[MongoDB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[MongoDB] Successfully connected to database');
      return mongoose;
    }).catch((error) => {
      console.error('[MongoDB] Connection failed:', error.message);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    const errorMessage = e?.message || 'Unknown error';
    console.error('[MongoDB] Failed to connect to MongoDB:', errorMessage);
    console.error('[MongoDB] Error details:', {
      name: e?.name,
      code: e?.code,
      message: errorMessage,
    });
    // Don't throw - return null so app can fallback to localStorage
    return null;
  }

  return cached.conn;
}

export default connectDB;

