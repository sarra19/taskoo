import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid password" }, { status: 401 });
    }

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
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { message: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
