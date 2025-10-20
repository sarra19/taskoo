import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";


const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Email invalide."),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

   
    const { name, email, password } = registerSchema.parse(body);

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email déjà utilisé." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash });
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Utilisateur enregistré avec succès.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);

 
    if (error instanceof ZodError) {
      return NextResponse.json(
  {
          message: "Validation error",
          errors: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
