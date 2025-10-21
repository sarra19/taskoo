import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IProject extends Document {
  _id: ObjectId;
  title: string;
  description?: string;
  team: ObjectId[];
  progress: number;
  status: "in-progress" | "completed";
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    description: { type: String },
    team: [{ type: Schema.Types.ObjectId, ref: "User" }],
    progress: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);
