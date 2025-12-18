import mongoose, { Schema, Model } from 'mongoose';
import type { MoviesData, MediaEntry, WatchEntry, UserPreferences } from '@/lib/types';

const USER_ID = 'default-user';

// Subdocument schemas
const MediaEntrySchema = new Schema<MediaEntry>({
  id: { type: String, required: true },
  tmdbId: { type: Number, required: true, index: true },
  type: {
    type: String,
    enum: ['movie', 'tv'],
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  posterPath: String,
  backdropPath: String,
  overview: { type: String, required: true },
  releaseDate: String,
  firstAirDate: String,
  genres: [String],
  rating: { type: Number, default: 0 },
  popularity: { type: Number, default: 0 },
  addedAt: { type: String, required: true },
}, { _id: false });

const WatchEntrySchema = new Schema<WatchEntry>({
  id: { type: String, required: true },
  mediaId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['watched', 'watchlist'],
    required: true,
    index: true,
  },
  rating: {
    type: String,
    enum: ['thumbs_up', 'thumbs_down'],
  },
  watchedDate: String,
  addedDate: { type: String, required: true, index: true },
  notes: String,
}, { _id: false });

const UserPreferencesSchema = new Schema<UserPreferences>({
  genreWeights: {
    type: Map,
    of: Number,
    default: {},
  },
  preferredTypes: [{
    type: String,
    enum: ['movie', 'tv'],
  }],
  lastRefined: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

// Main MoviesData schema
const MoviesDataSchema = new Schema({
  userId: {
    type: String,
    required: true,
    default: USER_ID,
    index: true,
  },
  mediaEntries: [MediaEntrySchema],
  watchEntries: [WatchEntrySchema],
  preferences: {
    type: UserPreferencesSchema,
    default: () => ({
      genreWeights: {},
      preferredTypes: ['movie', 'tv'],
      lastRefined: new Date().toISOString(),
    }),
  },
  lastModified: { type: Date, default: Date.now, index: true },
}, {
  timestamps: true,
});

// Indexes for faster queries
MoviesDataSchema.index({ userId: 1, lastModified: -1 });
MoviesDataSchema.index({ userId: 1, 'watchEntries.status': 1 });
MoviesDataSchema.index({ userId: 1, 'watchEntries.addedDate': -1 });
MoviesDataSchema.index({ userId: 1, 'mediaEntries.tmdbId': 1 });
MoviesDataSchema.index({ userId: 1, 'mediaEntries.type': 1 });

export interface MoviesDataDocument extends Omit<MoviesData, 'lastModified'>, mongoose.Document {
  userId: string;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MoviesDataModel: Model<MoviesDataDocument> =
  mongoose.models.MoviesData || mongoose.model<MoviesDataDocument>('MoviesData', MoviesDataSchema);

export default MoviesDataModel;

