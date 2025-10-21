import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";

// ✅ Validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Email invalide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const avatarFile = formData.get("avatar") as File | null;

    // ✅ Validate fields
    registerSchema.parse({ name, email, password });

    await connectDB();

    // 🔍 Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Email déjà utilisé." }, { status: 400 });
    }

    // 🔐 Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 🧩 Handle avatar upload (save in /public/images)
    let avatarUrl = "/images/default-avatar.png";

    if (avatarFile && avatarFile.size > 0) {
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), "public", "images");

      // ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${avatarFile.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      avatarUrl = `/images/${fileName}`;
    }

    // 🧱 Create new user
    const user = new User({
      name,
      email,
      passwordHash,
      avatar: avatarUrl,
      role: "member",
    });

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Utilisateur enregistré avec succès.",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Erreur de validation",
          errors: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
