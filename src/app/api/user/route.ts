import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

// ✅ Schéma Zod pour valider les champs du body
const updateUserSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").optional(),
  email: z.string().email("Email invalide.").optional(),
  newPassword: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères.")
    .optional(),
});

export async function PUT(req: Request) {
  try {
    // ✅ Récupération du token depuis les cookies
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ Vérification du token JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    // ✅ Lecture + validation du body
    const body = await req.json();
    const { name, email, newPassword } = updateUserSchema.parse(body);

    await connectDB();

    // ✅ Préparation des champs à mettre à jour
    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (newPassword && newPassword.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.passwordHash = hashedPassword;
    }

    // ✅ Mise à jour dans la base de données
    const updatedUser = await User.findByIdAndUpdate(
      payload.userId,
      { $set: updates },
      { new: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Update error:", error);

    // ✅ Gestion propre des erreurs Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    if (error.name === "TokenExpiredError") {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }

    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}
