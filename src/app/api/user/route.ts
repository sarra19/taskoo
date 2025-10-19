import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

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

    // ✅ Lecture du body JSON
    const body = await req.json();
    const { name, email, newPassword } = body;

    await connectDB();

    // ✅ Préparation des champs à mettre à jour
    const updates: any = {};
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
    if (error.name === "TokenExpiredError") {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}
