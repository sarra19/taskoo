import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import fs from "fs";

// ✅ Validation schema for update
const updateUserSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").optional(),
  email: z.string().email("Email invalide.").optional(),
  newPassword: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères.")
    .optional()
    .or(z.literal("")),
});

// ✅ GET — fetch all users
export async function GET() {
  try {
    await connectDB();
    const users = await User.find({}, "-passwordHash -__v").sort({ createdAt: -1 });
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
}

// ✅ PUT — update user info and avatar
export async function PUT(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    await connectDB();

    const formData = await req.formData();
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const newPassword = formData.get("newPassword")?.toString();
    const avatarFile = formData.get("avatar") as File | null;

    // ✅ Validate input
    const parsed = updateUserSchema.safeParse({ name, email, newPassword });
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        path: issue.path[0],
        message: issue.message,
      }));
      return NextResponse.json({ errors }, { status: 400 });
    }

    const existingUser = await User.findById(payload.userId);
    if (!existingUser)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    const updates: Record<string, any> = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    // ✅ Password update logic
    if (newPassword && newPassword.trim().length > 0) {
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // ✅ Avatar upload (save in /public/images)
    if (avatarFile && avatarFile.size > 0) {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public", "images");

      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${payload.userId}-${Date.now()}-${avatarFile.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      // Delete old avatar if not default
      if (
        existingUser.avatar &&
        existingUser.avatar !== "/images/default-avatar.png"
      ) {
        const oldPath = path.join(process.cwd(), "public", existingUser.avatar);
        try {
          await unlink(oldPath);
        } catch {
          console.warn("⚠️ Could not delete old avatar (missing file)");
        }
      }

      updates.avatar = `/images/${fileName}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      payload.userId,
      { $set: updates },
      { new: true }
    ).select("-passwordHash");

    return NextResponse.json({
      message: "Profil mis à jour avec succès ✅",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Update error:", error);
    if (error.name === "TokenExpiredError")
      return NextResponse.json({ message: "Token expiré" }, { status: 401 });

    return NextResponse.json({ message: "Échec de la mise à jour" }, { status: 500 });
  }
}
