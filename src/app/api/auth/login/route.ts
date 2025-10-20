import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z, ZodError } from "zod";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

// ✅ Define validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "A valid email is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Validate request body using Zod
    const { email, password } = loginSchema.parse(body);

    await connectDB();

    // ✅ Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ✅ Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid password" }, { status: 401 });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // ✅ Set cookie with NextResponse
    const response = NextResponse.json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return response;

  } catch (err: unknown) {
    console.error("Login error:", err);

    // ✅ Handle Zod validation errors properly
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: err.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // ✅ Handle other errors
    return NextResponse.json(
      { message: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
