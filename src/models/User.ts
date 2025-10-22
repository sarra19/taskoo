import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IUser extends Document {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "member";
  avatar?: string; // URL de l’image de profil
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    // 👇 Nouveau champ : rôle de l'utilisateur
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },

    // 👇 Nouveau champ : image de profil (URL)
    avatar: {
      type: String,
      default: "/images/user/user.jpg",
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
