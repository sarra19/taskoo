import mongoose, { Schema, Document, ObjectId,  } from "mongoose";

export interface ITask extends Document {
  _id: ObjectId;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  dueDate?: Date;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['todo','in-progress','done','blocked'], default: 'todo' },
  priority: { type: String, enum: ['low','medium','high','urgent'], default: 'low' },
  tags: [{ type: String }],
  dueDate: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
