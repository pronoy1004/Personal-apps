import mongoose, { Schema, Model } from 'mongoose';
import type { KanbanData, Task, Column } from '@/lib/types';

// Single user identifier - can be changed later if needed
const USER_ID = 'default-user';

// Subdocument schemas
const SubtaskSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
}, { _id: false });

const AttachmentSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['url', 'file'], required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  addedAt: { type: String, required: true },
}, { _id: false });

const TimeEntrySchema = new Schema({
  id: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: String,
  duration: { type: Number, default: 0 },
}, { _id: false });

const ActivityEntrySchema = new Schema({
  id: { type: String, required: true },
  action: { 
    type: String, 
    enum: ['created', 'moved', 'edited', 'completed', 'archived', 'restored', 'priority_changed', 'tag_added', 'time_logged'],
    required: true 
  },
  timestamp: { type: String, required: true },
  details: String,
  previousValue: String,
  newValue: String,
}, { _id: false });

const TaskSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  status: { type: String, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  dueDate: String,
  color: String,
  tags: [String],
  subtasks: [SubtaskSchema],
  attachments: [AttachmentSchema],
  timeTracked: { type: Number, default: 0 },
  timeEntries: [TimeEntrySchema],
  activityLog: [ActivityEntrySchema],
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
  archivedAt: String,
}, { _id: false });

const ColumnSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  color: String,
  order: { type: Number, required: true },
  createdAt: { type: String, required: true },
}, { _id: false });

const SortPreferenceSchema = new Schema({
  option: { 
    type: String, 
    enum: ['dueDate', 'priority', 'alphabetical', 'createdAt', 'timeTracked'],
    required: true 
  },
  direction: { type: String, enum: ['asc', 'desc'], required: true },
}, { _id: false });

const SettingsSchema = new Schema({
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  autoArchiveDays: { type: Number, default: 30 },
  defaultPriority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  sortPreferences: { type: Map, of: SortPreferenceSchema, default: {} },
}, { _id: false });

// Main KanbanData schema
const KanbanDataSchema = new Schema({
  userId: { 
    type: String, 
    required: true, 
    default: USER_ID,
    index: true 
  },
  tasks: [TaskSchema],
  columns: [ColumnSchema],
  settings: { type: SettingsSchema, default: {} },
  lastModified: { type: Date, default: Date.now, index: true },
}, {
  timestamps: true,
});

// Index for faster queries
KanbanDataSchema.index({ userId: 1, lastModified: -1 });

export interface KanbanDataDocument extends Omit<KanbanData, 'settings'>, mongoose.Document {
  userId: string;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    theme: 'light' | 'dark' | 'system';
    autoArchiveDays: number;
    defaultPriority: 'high' | 'medium' | 'low';
    sortPreferences: Record<string, { option: string; direction: string }>;
  };
}

const KanbanDataModel: Model<KanbanDataDocument> = 
  mongoose.models.KanbanData || mongoose.model<KanbanDataDocument>('KanbanData', KanbanDataSchema);

export default KanbanDataModel;

