import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ success: true, message: "✅ Database connected!" });
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json({ success: false, message: "Database connection failed" }, { status: 500 });
  }
}
