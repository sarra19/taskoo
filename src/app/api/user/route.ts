import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import User from "@/models/User";
import { connectDB } from "@/lib/db";


const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .optional(),
  email: z.string().email("Email invalide.").optional(),
  newPassword: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères.")
    .optional(),
});

export async function PUT(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const body = await req.json();

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        path: issue.path[0],
        message: issue.message,
      }));
      return NextResponse.json({ errors }, { status: 400 });
    }

    const { name, email, newPassword } = parsed.data;

    await connectDB();

    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (newPassword && newPassword.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.passwordHash = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      payload.userId,
      { $set: updates },
      { new: true }
    ).select("-passwordHash");

    if (!updatedUser)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Update error:", error);

    if (error.name === "TokenExpiredError")
      return NextResponse.json({ message: "Token expired" }, { status: 401 });

    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}
