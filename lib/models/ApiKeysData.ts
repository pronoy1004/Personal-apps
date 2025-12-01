import mongoose, { Schema, Model } from 'mongoose';
import type { ApiKeysData, ApiKeyEntry } from '@/lib/types';

const USER_ID = 'default-user';

const ApiKeyEntrySchema = new Schema<ApiKeyEntry>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  service: { type: String, required: true },
  key: { type: String, required: true }, // encrypted blob
  expiry: { type: String },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
}, { _id: false });

const ApiKeysDataSchema = new Schema({
  userId: {
    type: String,
    required: true,
    default: USER_ID,
    index: true,
  },
  passcodeHash: { type: String },
  passcodeSalt: { type: String },
  keys: { type: [ApiKeyEntrySchema], default: [] },
  lastModified: { type: Date, default: Date.now, index: true },
}, {
  timestamps: true,
});

ApiKeysDataSchema.index({ userId: 1, lastModified: -1 });

export interface ApiKeysDataDocument extends Omit<ApiKeysData, 'lastModified'>, mongoose.Document {
  userId: string;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeysDataModel: Model<ApiKeysDataDocument> =
  mongoose.models.ApiKeysData || mongoose.model<ApiKeysDataDocument>('ApiKeysData', ApiKeysDataSchema);

export default ApiKeysDataModel;

